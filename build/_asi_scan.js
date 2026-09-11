// 扫描 ASI 陷阱：上一行以 字符串结尾引号/标识符 结束且无运算符，下一行以字符串/标识符开头
const fs = require('fs');
const src = fs.readFileSync('football-career-simulator.html', 'utf8');
const m = src.match(/<script>([\s\S]*)<\/script>/);
const lines = m[1].split('\n');
let bad = 0;
const endsOp = /[+\-*/%&|,;:.?)(\]}>]$|=>$/;
for (let i = 0; i < lines.length - 1; i++) {
  const a = lines[i].trim().replace(/\/\/.*$/, '').trimEnd();
  const b = lines[i + 1].trim();
  if (!a || !b) continue;
  if (endsOp.test(a)) continue;                       // 上一行以运算符/括号结尾 → 安全
  if (/^(\/\/|\/\*|\*|\.|:|else|return|case|break|continue|const|let|var|function|if|for|while|switch|try|catch|\})/.test(b)) continue;
  // 下一行以 字符串开头 或 标识符+(`(`除外) 且上一行是表达式结尾
  const bStartsStr = /^['"`]/.test(b);
  const aEndsVal = /['"]$/.test(a) || /\w$|\)$|\]$/.test(a);
  if (bStartsStr && aEndsVal) { bad++; console.log('L' + (i + 1) + ' …' + a.slice(-70)); console.log('   next→ ' + b.slice(0, 70)); }
}
console.log('suspicious lines:', bad);
