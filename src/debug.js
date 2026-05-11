import { APPStacker } from './stacker.js';

/**
 * Debug Mode - Console-based testing for pathFinding algorithm
 * Collects check.matched failures to debug pathFinding issues
 */

class DebugMode {
    constructor() {
        this.stacker = this._createStacker();
        
        this.failedCases = [];
        this.successCases = [];
        this.totalTests = 0;
        this.bot = null;
        this.isRunning = false;
        this.lastGameMsg = null;
        this.invalidSuggestionCount = 0;
        this.botPath = null;
    }

    _createStacker() {
        const stacker = new APPStacker();
        stacker.spawn();
        stacker.setGarbageList([2, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 1, 3, 0, 0, 0, 0, 0, 4, 0, 0]);
        return stacker;
    }

    /**
     * Initialize debug mode
     */
    init(botPath) {
        this.botPath = botPath;
        this.bot = new Worker(botPath);
        
        this.bot.onmessage = (m) => {
            this._handleBotMessage(m);
        };
        
        // Delay first handshake slightly so worker service is ready.
        setTimeout(() => {
            if (!this.isRunning) {
                return;
            }
            this.bot.postMessage({ "type": "info" });
            console.log('[DEBUG] Bot initialized');
        }, 100);
    }

    /**
     * Handle messages from bot
     */
    _handleBotMessage(m) {
        const data = m.data;
        
        switch (data.type) {
            case "info":
                this._sendRules();
                break;
            case "ready":
                this._sendGameStart();
                break;
            case "suggestion":
                this._processSuggestion(data);
                break;
            default:
                console.log('[DEBUG] Unknown message type:', data.type);
        }
    }

    /**
     * Send rules to bot
     */
    _sendRules() {
        console.log('[DEBUG] Sending rules...');
        this.bot.postMessage({ "type": "rules" });
    }

    /**
     * Send initial game state
     */
    _sendGameStart() {
        const board = this._getEmptyBoard();
        this._convertBoard(board);
        
        const gameMsg = {
            "type": "start",
            "hold": this.stacker.hold == '' ? null : this.stacker.hold,
            "combo": 0,
            "back_to_back": false,
            "board": board,
            "queue": (this.stacker.piece.type + this.stacker.queue).split("")
        };
        
        console.log('[DEBUG] Sending game start...');
        console.log('[DEBUG] Board:', gameMsg.board[0]);
        console.log('[DEBUG] Queue:', gameMsg.queue);
        console.log('[DEBUG] Hold:', gameMsg.hold);
        
        this.bot.postMessage(gameMsg);
        
        // Store for reuse in future messages
        this.lastGameMsg = gameMsg;
        
        // Request suggestion with longer delay
        setTimeout(() => {
            console.log('[DEBUG] Requesting initial suggestion...');
            this._requestSuggestion();
        }, 500);
    }

    /**
     * Request suggestion from bot
     */
    _requestSuggestion() {
        if (!this.isRunning) return;
        this.bot.postMessage({ "type": "suggest" });
    }

    _restartAfterDeadlock() {
        if (!this.isRunning) {
            return;
        }

        console.warn('[DEBUG] Spawn collision after replay; restarting debug round');
        this.invalidSuggestionCount = 0;
        this.lastGameMsg = null;
        this.stacker = this._createStacker();

        if (this.bot) {
            this.bot.terminate();
            this.bot = null;
        }

        this.init(this.botPath);
    }

    /**
     * Process suggestion from bot
     */
    _processSuggestion(data) {
        const moves = Array.isArray(data.moves) ? data.moves : [];
        const move = moves[0];
        
        if (!move || !move.location) {
            this.invalidSuggestionCount++;
            console.warn('[DEBUG] Invalid suggestion payload:', data);
            if (this.invalidSuggestionCount >= 8) {
                console.warn('[DEBUG] Too many invalid suggestions, forcing full state sync');
                this._sendFullStateUpdate();
                this.invalidSuggestionCount = 0;
            }
            // Retry with delay
            setTimeout(() => this._requestSuggestion(), 200);
            return;
        }
        this.invalidSuggestionCount = 0;

        this.totalTests++;
        const holdBeforeMove = this.stacker.hold;
        let steps;
        let check;
        
        try {
            // Test pathFinding
            ({ steps, check } = this.stacker.pathFindingWithCheck(move.location, move.spin));
        } catch (error) {
            this.failedCases.push({
                testNum: this.totalTests,
                move,
                error: String(error && error.message ? error.message : error),
                boardState: this._getMismatchSnapshot(),
            });
            console.warn(`[FAIL #${this.totalTests}] pathFinding exception: ${error.message || error}`);
            console.warn(`  Move: [${move.location.type}] x:${move.location.x} y:${move.location.y}`);

            // Try to recover by syncing full state and continue.
            this._sendFullStateUpdate();
            setTimeout(() => this._requestSuggestion(), 250);
            return;
        }
        
        // Record result
        const caseData = {
            testNum: this.totalTests,
            move,
            steps,
            check: {
                landing: check.landing,
                expected: check.expected,
                expected180: check.expected180,
                matched: check.matched
            },
            boardState: this._getMismatchSnapshot()
        };

        if (!check.matched) {
            this.failedCases.push(caseData);
            console.warn(`[FAIL #${this.totalTests}] Landing mismatch!`);
            console.warn(`  Move: [${move.location.type}] x:${move.location.x} y:${move.location.y}`);
            console.warn(`  Landing:    ${this._locationString(check.landing)}`);
            console.warn(`  Expected:   ${this._locationString(check.expected)}`);
        } else {
            this.successCases.push(caseData);
            console.log(`[PASS #${this.totalTests}] ✓`);
        }

        // Mirror production ordering:
        // 1) tell bot which move was chosen, 2) advance local state, 3) sync next piece/board.
        this.bot.postMessage({"type": "play", "move": move});

        // Keep local stacker in sync with bot by replaying exactly the same steps.
        // Without this, next suggestion gets checked against the wrong active piece.
        this._applyStepsToStacker(steps);

        // Mirror production flow: notify bot about newly spawned piece(s) or full board update.
        this._syncBotStateAfterMove(holdBeforeMove);

        if (this.stacker.isSpawnCollision()) {
            this._restartAfterDeadlock();
            return;
        }
        
        // Give the worker a bit more time to digest play + state update before next suggest.
        setTimeout(() => this._requestSuggestion(), 300);
    }

    _applyStepsToStacker(steps) {
        for (const step of steps) {
            if (step === 'delay') {
                continue;
            }
            this.stacker.apply(step);
        }
    }

    _syncBotStateAfterMove(holdBeforeMove) {
        if (!this.stacker.garbageTick) {
            if (holdBeforeMove === '' && holdBeforeMove !== this.stacker.hold) {
                this.bot.postMessage({ "type": "new_piece", "piece": this.stacker.queue.slice(-2, -1) });
            }
            this.bot.postMessage({ "type": "new_piece", "piece": this.stacker.queue.slice(-1) });
            return;
        }

        this._sendFullStateUpdate();
    }

    _sendFullStateUpdate() {
        if (!this.stacker.piece) {
            console.warn('[DEBUG] Cannot send full state update: active piece is null');
            return;
        }
        const board = this._getEmptyBoard();
        this._convertBoard(board);
        const gameMsg = {
            "type": "start",
            "hold": this.stacker.hold === '' ? null : this.stacker.hold,
            "combo": this.stacker.combos + 1,
            "back_to_back": this.stacker.b2b >= 0,
            "board": board,
            "queue": (this.stacker.piece.type + this.stacker.queue).split("")
        };
        this.lastGameMsg = gameMsg;
        this.bot.postMessage(gameMsg);
    }

    /**
     * Start debug mode with duration (ms)
     */
    start(botPath, durationMs = 10000) {
        this.isRunning = true;
        this.init(botPath);
        
        // Stop after specified duration
        setTimeout(() => {
            this.stop();
        }, durationMs);
    }

    /**
     * Stop debug mode and export results
     */
    stop() {
        this.isRunning = false;
        if (this.bot) {
            this.bot.terminate();
        }
        console.log('\n========== DEBUG REPORT ==========');
        console.log(`Total tests: ${this.totalTests}`);
        console.log(`Passed: ${this.successCases.length}`);
        console.log(`Failed: ${this.failedCases.length}`);
        console.log(`Success rate: ${this.totalTests > 0 ? (this.successCases.length / this.totalTests * 100).toFixed(2) : 0}%`);
        console.log('==================================\n');
        
        this.exportResults();
    }

    /**
     * Export results to file/console
     */
    exportResults() {
        const results = {
            summary: {
                totalTests: this.totalTests,
                passed: this.successCases.length,
                failed: this.failedCases.length,
                successRate: this.totalTests > 0 ? (this.successCases.length / this.totalTests * 100) : 0,
                timestamp: new Date().toISOString()
            },
            failedCases: this.failedCases,
            successCases: this.successCases.slice(0, 10) // Keep first 10 for reference
        };

        console.log('[RESULTS]', JSON.stringify(results, null, 2));
        
        // Return for node.js export
        return results;
    }

    /**
     * Helper: Get empty board
     */
    _getEmptyBoard() {
        const board = [];
        for (let i = 0; i < 40; i++) {
            board.push(Array(10).fill(null));
        }
        return board;
    }

    /**
     * Helper: Convert internal board format to array format
     */
    _convertBoard(board) {
        for (let y = 0; y < this.stacker.matrix.length; y++) {
            for (let x = 0; x < this.stacker.matrix[y].length; x++) {
                const cell = this.stacker.matrix[y][x];
                if (cell !== '_') {
                    board[y][x] = cell;
                }
            }
        }
    }

    /**
     * Helper: Get mismatch snapshot
     */
    _getMismatchSnapshot() {
        const board = this._getEmptyBoard();
        this._convertBoard(board);
        return {
            matrix: this.stacker.matrix.map(row => row.slice()),
            piece: this.stacker.piece ? Object.assign({}, this.stacker.piece) : null,
            hold: this.stacker.hold,
            queue: this.stacker.queue,
            board,
        };
    }

    /**
     * Helper: Location to string
     */
    _locationString(location) {
        if (!location) return 'null';
        return `[${location.type}] x:${location.x} y:${location.y} r:${location.rotation}`;
    }
}

// Export for node.js/jest testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DebugMode };
}

export { DebugMode };
