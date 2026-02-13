let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestNames: string[] = [];

function describe(name: string, fn: () => void): void {
    console.log(`\n${name}`);
    try {
        fn();
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Ошибка в группе тестов: ${error.message}`);
        }
    }
}

function it(name: string, fn: () => void): void {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${name}`);
    } catch (error: unknown) {
        failedTests++;
        failedTestNames.push(name);
        console.error(`  ✗ ${name}`);
        if (error instanceof Error) {
            console.error(`    ${error.message}`);
        }
    }
}

function printSummary(): void {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Всего тестов: ${totalTests}`);
    console.log(`Пройдено: ${passedTests}`);
    console.log(`Провалено: ${failedTests}`);
    
    if (failedTests > 0) {
        console.log(`\nПроваленные тесты:`);
        failedTestNames.forEach(name => {
            console.log(`  - ${name}`);
        });
        process.exit(1);
    } else {
        console.log(`\nВсе тесты прошли успешно!`);
        process.exit(0);
    }
}

export { describe, it, printSummary };
