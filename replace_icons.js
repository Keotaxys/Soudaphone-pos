const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src', 'components', 'screens'),
  path.join(__dirname, 'src', 'components', 'ui'),
  path.join(__dirname, 'src', 'components', 'modals'),
  path.join(__dirname, 'app')
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace Ionicons outline with solid
            content = content.replace(/<Ionicons([^>]*)name="([^"]+)-outline"([^>]*)>/g, '<Ionicons$1name="$2"$3>');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated icons in:', fullPath);
            }
        }
    }
}

directories.forEach(processDirectory);
console.log('Done.');
