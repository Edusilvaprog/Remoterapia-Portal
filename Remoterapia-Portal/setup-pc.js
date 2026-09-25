const fs = require('fs');
const file = 'app/pc/page.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const newLines = lines.slice(0, 477); // up to `return (`

newLines.push('  return (');
newLines.push('    <>');
newLines.push('      {view === "login" || view === "trocar_senha" ? (');
newLines.push('         <div className="w-full h-[100dvh] bg-sky-50 flex items-center justify-center p-4">');
newLines.push('           <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">');
newLines.push('             <h1 className="text-2xl font-black text-[#032b57] mb-4">Remoterapia Desktop</h1>');
newLines.push('             <p className="text-slate-500 mb-6">Ambiente isolado de desenvolvimento.</p>');
newLines.push('             <button className="bg-[#0284c7] text-white px-6 py-3 rounded-xl font-bold w-full" onClick={() => { window.location.href="/" }}>Ir para Login Mobile</button>');
newLines.push('             <p className="text-xs text-sky-600 mt-4">Faça login na tela principal do celular primeiro e recarregue esta página.</p>');
newLines.push('           </div>');
newLines.push('         </div>');
newLines.push('      ) : (');
newLines.push('        <DesktopApp ');
newLines.push('          alunoData={alunoData} agendamentos={agendamentos} caiaques={caiaques} lockers={lockers} configTabelaClubes={configTabelaClubes} reservasSemana={reservasSemana} disponiveisSemana={disponiveisSemana} view={view} setView={setView} showToast={showToast} handleLogout={handleLogout} fetchPainel={() => fetchPainel(alunoId, view)}');
newLines.push('        />');
newLines.push('      )}');
newLines.push('    </>');
newLines.push('  )');
newLines.push('}');

fs.writeFileSync(file, "import DesktopApp from '@/components/desktop/DesktopApp';\n" + newLines.join('\n'));

const comps = ['AbaInicioDesktop', 'AbaAgendarDesktop', 'AbaEventosDesktop', 'AbaHistoricoDesktop', 'AbaPerfilDesktop'];
comps.forEach(c => {
    fs.writeFileSync('components/desktop/' + c + '.tsx', 'export default function ' + c + '(props: any) { return <div className="p-8 text-2xl font-bold text-sky-900">' + c + ' - Em Construção</div>; }');
});
console.log('Script executado com sucesso!');
