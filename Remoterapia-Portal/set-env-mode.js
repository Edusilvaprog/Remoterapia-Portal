const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Remove o hook isDesktop
content = content.replace(
  "const [isDesktop, setIsDesktop] = useState(false)\n  useEffect(() => {\n    if (typeof window !== 'undefined') {\n      const handleResize = () => setIsDesktop(window.innerWidth >= 1024)\n      handleResize()\n      window.addEventListener('resize', handleResize)\n      return () => window.removeEventListener('resize', handleResize)\n    }\n  }, [])",
  ""
);

// Substitui a condicional isDesktop pela variável de ambiente
content = content.replace(
  "if (isDesktop && view !== 'login' && view !== 'trocar_senha') {",
  "if (process.env.NEXT_PUBLIC_MODE === 'desktop' && view !== 'login' && view !== 'trocar_senha') {"
);

fs.writeFileSync('app/page.tsx', content);
console.log('Script executado: page.tsx agora usa NEXT_PUBLIC_MODE');
