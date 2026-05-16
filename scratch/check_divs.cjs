const fs = require('fs');
const content = fs.readFileSync('src/components/onboarding-form.tsx', 'utf8');

const lines = content.split('\n');
let stack = [];

lines.forEach((line, i) => {
    const openMatches = line.matchAll(/<div/g);
    for (const match of openMatches) {
        stack.push({ line: i + 1, type: 'open' });
    }
    const closeMatches = line.matchAll(/<\/div>/g);
    for (const match of closeMatches) {
        if (stack.length === 0) {
            console.log(`Extra closing div at line ${i + 1}`);
        } else {
            stack.pop();
        }
    }
});

stack.forEach(item => {
    console.log(`Unclosed div opened at line ${item.line}`);
});
