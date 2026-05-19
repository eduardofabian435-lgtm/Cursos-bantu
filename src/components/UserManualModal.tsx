import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ShieldAlert, 
  Lock, 
  Scale, 
  FileEdit, 
  AlertOctagon, 
  X,
  CheckCircle2,
  Info
} from 'lucide-react';

interface UserManualModalProps {
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ onClose }) => {
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
        className="relative z-10 w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Manual do Usuário</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Guia de Conduta e Operação Bantu</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
          
          {/* 1. Introdução */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px]">01</span>
              Introdução e Objetivo
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Finalidade do Sistema</p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Este sistema é a ferramenta oficial e centralizada para a gestão de alunos e atividades da instituição. Sua operação correta é vital para a continuidade dos nossos cursos.
                </p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Cultura de Privacidade</p>
                <p className="text-sm text-emerald-800 leading-relaxed font-bold">
                  A proteção dos dados dos alunos é uma prioridade ética inegociável. Tratamos cada informação com o respeito e a segurança que gostaríamos que tivessem com nossos próprios dados.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Seguranca */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px]">02</span>
              Controle de Acesso e Segurança
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
              <div className="p-4 flex gap-4 items-start">
                <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Credenciais Únicas</p>
                  <p className="text-xs text-slate-500 font-medium">O login e a senha são pessoais e intransferíveis. O compartilhamento de contas é estritamente proibido.</p>
                </div>
              </div>
              <div className="p-4 flex gap-4 items-start">
                <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Encerramento de Sessão</p>
                  <p className="text-xs text-slate-500 font-medium">Sempre realize o logout (sair) ao se afastar do computador. Não deixe o sistema aberto em locais públicos.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. LGPD */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px]">03</span>
              Boas Práticas (LGPD)
            </h3>
            <div className="space-y-4">
              <div className="bg-rose-50 border-l-4 border-rose-400 p-6 rounded-r-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <AlertOctagon className="w-5 h-5 text-rose-500" />
                  <p className="text-xs font-black text-rose-800 uppercase tracking-widest">Atenção Crítica</p>
                </div>
                <p className="text-sm text-rose-900 font-bold leading-relaxed">
                  É terminantemente proibido salvar listas de alunos em dispositivos pessoais (pen drives, celulares ou computadores particulares).
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-1">Princípio da Necessidade</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Acesse apenas os dados necessários para realizar a tarefa do momento.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-1">Download e Exportação</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Regras rígidas sobre a exportação de planilhas. Toda exportação deve ser justificada.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Etica */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px]">04</span>
              Ética e Conduta Profissional
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed font-medium space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <p><span className="font-bold text-slate-800">Uso Institucional:</span> Telefones e endereços só podem ser usados para contatos oficiais da Bantu.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <p><span className="font-bold text-slate-800">Sigilo Externo:</span> Não discuta dados de alunos em ambientes públicos ou com pessoas externas à organização.</p>
              </div>
            </div>
          </section>

          {/* 5. Guia Operacional */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px]">05</span>
              Guia Operacional (Passo a Passo)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-colors group">
                <FileEdit className="w-6 h-6 text-indigo-600 mb-4" />
                <p className="text-sm font-bold text-slate-800 mb-2">Cadastro e Matrícula</p>
                <ul className="text-[11px] text-slate-500 space-y-2 list-disc pl-4 font-medium">
                  <li>Use o botão "+" no dashboard principal</li>
                  <li>Preencha todos os campos obrigatórios</li>
                  <li>Certifique-se da grafia correta do nome completo</li>
                </ul>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 transition-colors group">
                <Info className="w-6 h-6 text-indigo-600 mb-4" />
                <p className="text-sm font-bold text-slate-800 mb-2">Suporte Técnico</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Em caso de erros ou dúvidas, clique no link de Suporte no rodapé para falar diretamente com o administrador via WhatsApp.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Consequencias */}
          <section className="space-y-4 pb-8">
            <h3 className="text-sm font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[10px]">06</span>
              Termo de Responsabilidade
            </h3>
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Scale className="w-24 h-24" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Monitoramento</p>
                  <p className="text-sm font-medium text-slate-300">Este sistema gera logs (rastros) de todas as ações. Sabemos quem acessou o quê, e quando.</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Sanções por Descumprimento</p>
                  <div className="grid grid-cols-2 gap-4 text-[11px] font-bold text-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Advertência Formal
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Suspensão de Acesso
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Desligamento/Expulsão
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Ação Civil e Criminal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Confidencial • Uso Interno</span>
          <button
            onClick={onClose}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
