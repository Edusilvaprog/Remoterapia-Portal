const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

if (!content.includes('import DesktopApp')) {
  content = content.replace(
    "import ThemeToggle from '@/components/ThemeToggle'",
    "import ThemeToggle from '@/components/ThemeToggle'\nimport DesktopApp from '@/components/desktop/DesktopApp'"
  );
}

if (!content.includes('const [isDesktop')) {
  content = content.replace(
    "const [view, _setView] = useState",
    "const [isDesktop, setIsDesktop] = useState(false)\n  useEffect(() => {\n    if (typeof window !== 'undefined') {\n      const handleResize = () => setIsDesktop(window.innerWidth >= 1024)\n      handleResize()\n      window.addEventListener('resize', handleResize)\n      return () => window.removeEventListener('resize', handleResize)\n    }\n  }, [])\n  const [view, _setView] = useState"
  );
}

if (!content.includes('<DesktopApp')) {
  const targetStr = "setView('login')\n    setLoading(false)\n  }";
  const replacement = `setView('login')
    setLoading(false)
  }

  if (isDesktop && view !== 'login' && view !== 'trocar_senha') {
    return (
      <DesktopApp 
        alunoData={alunoData} agendamentos={agendamentos} caiaques={caiaques} lockers={lockers} 
        configTabelaClubes={configTabelaClubes} reservasSemana={reservasSemana} 
        disponiveisSemana={disponiveisSemana} view={view} setView={setView} 
        showToast={showToast} handleLogout={handleLogout} 
        fetchPainel={() => fetchPainel(alunoId, view)} 
      />
    )
  }`;
  content = content.replace(targetStr, replacement);
}

fs.writeFileSync('app/page.tsx', content);
console.log('Successfully injected DesktopApp into page.tsx');
