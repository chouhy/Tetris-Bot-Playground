/**
 * Debug Results Analyzer
 * Analyzes failed pathFinding cases to identify patterns
 */

class DebugAnalyzer {
    constructor(results) {
        this.results = results;
        this.failedCases = results.failedCases || [];
    }

    /**
     * Analyze common patterns in failures
     */
    analyzePatterns() {
        console.log('\n📊 FAILURE PATTERN ANALYSIS');
        console.log('='.repeat(70));
        
        const patterns = {
            byPieceType: {},
            byRotation: {},
            byDimensionMismatch: {},
            byCoordinateMismatch: {}
        };

        this.failedCases.forEach(caseData => {
            const { check } = caseData;
            const piece = check.landing.type;

            // Group by piece type
            if (!patterns.byPieceType[piece]) {
                patterns.byPieceType[piece] = 0;
            }
            patterns.byPieceType[piece]++;

            // Group by rotation mismatch
            if (check.landing.rotation !== check.expected.rotation) {
                const key = `${check.landing.rotation} -> ${check.expected.rotation}`;
                if (!patterns.byRotation[key]) {
                    patterns.byRotation[key] = 0;
                }
                patterns.byRotation[key]++;
            }

            // Detect coordinate mismatches
            if (check.landing.x !== check.expected.x || 
                check.landing.y !== check.expected.y) {
                const dx = check.landing.x - check.expected.x;
                const dy = check.landing.y - check.expected.y;
                const key = `Δx:${dx} Δy:${dy}`;
                if (!patterns.byCoordinateMismatch[key]) {
                    patterns.byCoordinateMismatch[key] = 0;
                }
                patterns.byCoordinateMismatch[key]++;
            }
        });

        console.log('\n🎮 Failures by Piece Type:');
        Object.entries(patterns.byPieceType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([piece, count]) => {
                const pct = (count / this.failedCases.length * 100).toFixed(1);
                console.log(`  ${piece}: ${count} (${pct}%)`);
            });

        if (Object.keys(patterns.byRotation).length > 0) {
            console.log('\n🔄 Rotation Mismatches:');
            Object.entries(patterns.byRotation)
                .sort((a, b) => b[1] - a[1])
                .forEach(([rotation, count]) => {
                    const pct = (count / this.failedCases.length * 100).toFixed(1);
                    console.log(`  ${rotation}: ${count} (${pct}%)`);
                });
        }

        console.log('\n📍 Coordinate Mismatches (most common):');
        Object.entries(patterns.byCoordinateMismatch)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([coords, count]) => {
                const pct = (count / this.failedCases.length * 100).toFixed(1);
                console.log(`  ${coords}: ${count} (${pct}%)`);
            });

        return patterns;
    }

    /**
     * Get specific failed case details
     */
    getFailureDetails(index) {
        if (index < 0 || index >= this.failedCases.length) {
            console.error(`Invalid index: ${index}`);
            return null;
        }

        const caseData = this.failedCases[index];
        console.log(`\n🔍 FAILURE DETAILS (#${index})`);
        console.log('='.repeat(70));
        console.log('\nMove:');
        console.log(JSON.stringify(caseData.move, null, 2));
        console.log('\nSteps:');
        console.log(caseData.steps.join(' -> '));
        console.log('\nPredicted Landing:');
        console.log(JSON.stringify(caseData.check.landing, null, 2));
        console.log('\nExpected:');
        console.log(JSON.stringify(caseData.check.expected, null, 2));
        console.log('\nExpected (180°):');
        console.log(JSON.stringify(caseData.check.expected180, null, 2));

        return caseData;
    }

    /**
     * Export results to JSON file format
     */
    exportJSON() {
        const exportData = {
            summary: this.results.summary,
            analysis: this.analyzePatterns(),
            failedCases: this.failedCases
        };

        console.log('\n📥 Full Results JSON:');
        console.log(JSON.stringify(exportData, null, 2));

        return exportData;
    }

    /**
     * Generate a summary report
     */
    generateReport() {
        console.log('\n📋 DEBUG SUMMARY REPORT');
        console.log('='.repeat(70));
        console.log(`Total Tests: ${this.results.summary.totalTests}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`Success Rate: ${this.results.summary.successRate}%`);
        console.log(`Timestamp: ${this.results.summary.timestamp}`);
        console.log('='.repeat(70));

        if (this.failedCases.length > 0) {
            this.analyzePatterns();
            console.log('\nTop Failed Cases:');
            this.failedCases.slice(0, 5).forEach((caseData, idx) => {
                console.log(`  #${idx + 1}: [${caseData.check.landing.type}] Landing ${JSON.stringify(caseData.check.landing)} != Expected ${JSON.stringify(caseData.check.expected)}`);
            });
        } else {
            console.log('✅ All tests passed!');
        }

        console.log('='.repeat(70));
    }

    /**
     * Find cases with specific piece type
     */
    findByPiece(pieceType) {
        return this.failedCases.filter(c => c.check.landing.type === pieceType);
    }

    /**
     * Find cases with coordinate delta
     */
    findByCoordinateDelta(dx, dy) {
        return this.failedCases.filter(c => {
            const actualDx = c.check.landing.x - c.check.expected.x;
            const actualDy = c.check.landing.y - c.check.expected.y;
            return actualDx === dx && actualDy === dy;
        });
    }
}

export { DebugAnalyzer };
