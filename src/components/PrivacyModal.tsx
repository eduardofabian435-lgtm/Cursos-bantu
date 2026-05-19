import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertTriangle, Lock, FileText, X } from 'lucide-react';

interface PrivacyModalProps {
  onAccept: (metadata: { ip: string; version: string }) => void;
  acceptedAt?: any;
  onClose?: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onAccept, acceptedAt, onClose }) => {
  const [checked, setChecked] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [ip, setIp] = React.useState('Carregando...');
  const TERMS_VERSION = "2.1";

  const formattedDate = acceptedAt?.toDate 
    ? acceptedAt.toDate().toLocaleString('pt-BR') 
    : acceptedAt instanceof Date 
      ? acceptedAt.toLocaleString('pt-BR') 
      : null;

  React.useEffect(() => {
    if (!acceptedAt) {
      const fetchIP = async () => {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          setIp(data.ip);
        } catch (err) {
          console.warn("IP fetch error:", err);
          setIp('Não detectado');
        }
      };
      fetchIP();
    } else {
      setIp('Registrado');
    }
  }, [acceptedAt]);

  const handleAcceptClick = async () => {
    if (!checked || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAccept({ ip: ip === 'Carregando...' ? 'Indeterminado' : ip, version: TERMS_VERSION });
    } catch (error) {
      console.error("Accept terms error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Política de Privacidade</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gestor de Cursos Bantu</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {acceptedAt ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-xl flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Log Digital de Aceite</p>
                </div>
                <p className="text-xs text-emerald-600 font-medium leading-relaxed">
                  Termos aceitos em: <span className="font-bold text-emerald-800">{formattedDate}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IP de Registro</p>
                  <p className="text-xs font-mono font-bold text-slate-600">{ip}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versão</p>
                  <p className="text-xs font-mono font-bold text-slate-600">v{TERMS_VERSION}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Este sistema contém dados sensíveis e pessoais de alunos. O acesso é restrito a pessoal autorizado e todas as ações são monitoradas.
                </p>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                  Seu IP atual: {ip}
                </p>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Confidencialidade e Responsabilidade
            </h3>
            <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-medium">
              <div className="space-y-2">
                <p className="font-bold text-slate-800">1. Restrição de Uso:</p>
                <p>O Usuário devidamente autorizado a acessar este sistema compromete-se a utilizar as informações e dados pessoais dos alunos cadastrados exclusivamente para fins de gestão acadêmica e operacional do curso.</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">2. Proibição de Desvio de Finalidade:</p>
                <p>É expressamente proibida a extração, cópia, compartilhamento ou utilização de qualquer dado dos alunos para fins particulares, comerciais ou terceiros, sem a devida autorização formal da instituição.</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">3. Responsabilidade e Sanções:</p>
                <p>O uso indevido, o acesso não autorizado ou o vazamento de informações por culpa ou dolo do Usuário resultará em penalidades severas, que podem incluir:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><span className="font-bold text-rose-600">Sanções Administrativas:</span> Suspensão imediata do acesso ao sistema e desligamento definitivo do quadro de colaboradores ou parceiros (expulsão).</li>
                  <li><span className="font-bold text-rose-600">Sanções Civis e Criminais:</span> O infrator poderá ser responsabilizado judicialmente, respondendo a processos por danos morais e materiais, além de sanções previstas na Lei Geral de Proteção de Dados (LGPD) e demais legislações vigentes.</li>
                </ul>
              </div>
            </div>
          </section>

          {!acceptedAt && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 select-none cursor-pointer" onClick={() => setChecked(!checked)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                {checked && <ShieldCheck className="w-4 h-4 text-white" />}
              </div>
              <p className="text-xs text-slate-700 font-bold leading-tight uppercase tracking-tight">
                Li e concordo com os Termos de Segurança e Política de Privacidade do Sistema Bantu (v{TERMS_VERSION})
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4 items-start">
            <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Aviso Legal</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Ao clicar em "Eu Aceito", você confirma que leu, compreendeu e concorda em cumprir integralmente com estes termos de confidencialidade. Seu aceite gera um log digital vinculado ao seu e-mail e endereço IP ({ip}).
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 group cursor-help">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">Sistema Seguro Bantu v2.1</span>
          </div>
          {!acceptedAt ? (
            <button
              onClick={handleAcceptClick}
              disabled={!checked || isSubmitting}
              className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 ${checked && !isSubmitting ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </div>
              ) : "Eu Aceito os Termos"}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-4 bg-white rounded-2xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Termos Vinculados ao Perfil</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
