import { DebugMode } from './debug.js';

/**
 * Debug Runner - Simplified interface for running debug mode
 * Can be imported and used in index.html or Node.js
 */

class DebugRunner {
    constructor() {
        this.debugMode = null;
        this.resultsFile = 'debug-results.json';
    }

    /**
     * Run debug mode for N seconds
     * @param {string} botPath - Path to bot worker
     * @param {number} durationSeconds - How long to run (default: 30)
     * @returns {Promise<Object>} Results
     */
    async runDebug(botPath, durationSeconds = 30) {
        return new Promise((resolve) => {
            this.debugMode = new DebugMode();
            
            console.log(`\n📋 Starting Debug Mode...`);
            console.log(`🤖 Bot Path: ${botPath}`);
            console.log(`⏱️  Duration: ${durationSeconds}s\n`);
            
            this.debugMode.start(botPath, durationSeconds * 1000);
            
            // Resolve after duration
            setTimeout(() => {
                const results = this.debugMode.exportResults();
                resolve(results);
            }, durationSeconds * 1000 + 100);
        });
    }

    /**
     * Get failed cases for analysis
     */
    getFailedCases() {
        if (!this.debugMode) {
            console.error('Debug mode not initialized');
            return [];
        }
        return this.debugMode.failedCases;
    }

    /**
     * Print detailed report of failed cases
     */
    printFailedCasesReport() {
        if (!this.debugMode || this.debugMode.failedCases.length === 0) {
            console.log('✅ No failed cases!');
            return;
        }

        console.log('\n❌ FAILED CASES REPORT');
        console.log('='.repeat(60));
        
        this.debugMode.failedCases.forEach((caseData, idx) => {
            console.log(`\n📌 Failure #${idx + 1} (Test #${caseData.testNum})`);
            console.log('-'.repeat(60));
            console.log('Move:', JSON.stringify(caseData.move));
            console.log('Steps:', caseData.steps.join(' -> '));
            console.log('Landing:', this._locationToString(caseData.check.landing));
            console.log('Expected:', this._locationToString(caseData.check.expected));
            console.log('Expected180:', this._locationToString(caseData.check.expected180));
        });
        
        console.log('\n' + '='.repeat(60));
    }

    /**
     * Export results to JSON format
     */
    exportToJSON() {
        if (!this.debugMode) {
            console.error('Debug mode not initialized');
            return null;
        }

        const results = {
            summary: {
                totalTests: this.debugMode.totalTests,
                passed: this.debugMode.successCases.length,
                failed: this.debugMode.failedCases.length,
                successRate: this.debugMode.totalTests > 0 
                    ? (this.debugMode.successCases.length / this.debugMode.totalTests * 100).toFixed(2) 
                    : 0,
                timestamp: new Date().toISOString()
            },
            failedCases: this.debugMode.failedCases.map(c => ({
                testNum: c.testNum,
                move: c.move,
                steps: c.steps,
                check: c.check
            }))
        };

        // Log as JSON for copy-paste
        console.log('\n📊 RESULTS AS JSON:');
        console.log(JSON.stringify(results, null, 2));
        
        return results;
    }

    /**
     * Helper: Format location to string
     */
    _locationToString(location) {
        if (!location) return 'null';
        return `[${location.type}] x:${location.x} y:${location.y} rot:${location.rotation}`;
    }
}

// Global instance for browser console access
if (typeof window !== 'undefined') {
    window.debugRunner = new DebugRunner();
    console.log('✅ Debug runner available as: window.debugRunner');
    console.log('   Usage: await debugRunner.runDebug(botPath, durationSeconds)');
}

export { DebugRunner };
