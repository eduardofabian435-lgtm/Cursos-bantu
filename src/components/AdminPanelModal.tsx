import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  History, 
  X, 
  Crown, 
  UserPlus, 
  UserMinus,
  Search,
  Activity,
  Globe,
  Clock,
  ExternalLink,
  PiggyBank,
  Settings,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  getUsers, 
  updateUserRole, 
  getAuditLogs, 
  UserProfile, 
  AuditLog,
  getScholarshipConfig,
  saveScholarshipConfig,
  getStudentScholarships,
  updateStudentScholarship,
  getAllEnrollments,
  Enrollment,
  ScholarshipConfig,
  StudentScholarship
} from '../services/db';

interface AdminPanelModalProps {
  onClose: () => void;
  initialTab?: 'users' | 'logs' | 'scholarships';
  onDataUpdate?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ onClose, initialTab = 'users', onDataUpdate }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'scholarships'>(initialTab);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [scholarships, setScholarships] = useState<StudentScholarship[]>([]);
  const [scholarshipConfig, setScholarshipConfig] = useState<ScholarshipConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingConfig, setEditingConfig] = useState({
    monthlyValue: '550',
    benefits: 'Transporte + Refeição',
    requirements: 'Mínimo de 2 cursos inscritos simultaneamente'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'users') {
      const data = await getUsers();
      setUsers(data);
    } else if (activeTab === 'logs') {
      const data = await getAuditLogs(100);
      setLogs(data);
    } else if (activeTab === 'scholarships') {
      const [enrs, schols, config] = await Promise.all([
        getAllEnrollments(),
        getStudentScholarships(),
        getScholarshipConfig()
      ]);
      setEnrollments(enrs);
      setScholarships(schols);
      if (config) {
        setScholarshipConfig(config);
        setEditingConfig({
          monthlyValue: config.monthlyValue.toString(),
          benefits: config.benefits.join(', '),
          requirements: config.requirements
        });
      }
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    try {
      await saveScholarshipConfig({
        monthlyValue: parseFloat(editingConfig.monthlyValue),
        benefits: editingConfig.benefits.split(',').map(b => b.trim()),
        requirements: editingConfig.requirements,
        updatedAt: new Date()
      });
      alert('Configuração de bolsa salva com sucesso!');
      loadData();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      alert('Erro ao salvar configuração');
    }
  };

  const notifyScholarshipUpdate = async (studentId: string, name: string, count: number, status: StudentScholarship['status']) => {
    try {
      await updateStudentScholarship({
        studentId,
        studentName: name,
        enrolledCoursesCount: count,
        status,
        updatedAt: new Date()
      });
      loadData();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      alert('Erro ao atualizar status da bolsa');
    }
  };

  const getStudentsEligibility = () => {
    const studentEnrollments: { [studentId: string]: { name: string, count: number } } = {};
    // Count all enrollments regardless of status as requested ("registrados")
    enrollments.forEach(e => {
      if (!studentEnrollments[e.studentId]) {
        studentEnrollments[e.studentId] = { name: e.studentData.fullName, count: 0 };
      }
      studentEnrollments[e.studentId].count++;
    });

    return Object.entries(studentEnrollments)
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.name,
        enrolledCount: data.count,
        isEligible: data.count >= 2,
        currentStatus: scholarships.find(s => s.studentId === studentId)?.status || 'none'
      }))
      .filter(s => s.isEligible || scholarships.some(schol => schol.studentId === s.studentId));
  };

  const handleToggleRole = async (user: UserProfile) => {
    let newRole: 'student' | 'admin' | 'teacher';
    
    if (user.role === 'admin') newRole = 'student';
    else if (user.role === 'teacher') newRole = 'admin';
    else newRole = 'teacher';

    if (window.confirm(`Deseja alterar o cargo de ${user.name} para ${newRole.toUpperCase()}?`)) {
      await updateUserRole(user.uid, newRole);
      loadData();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Painel de Controle</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                Restrito • Acesso Master de Criador 
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                Auditado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className="w-4 h-4" /> Usuários
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <History className="w-4 h-4" /> Trilha de Auditoria
            </button>
            <button 
              onClick={() => setActiveTab('scholarships')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scholarships' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <PiggyBank className="w-4 h-4" /> Bolsas
            </button>
          </div>

          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          
          {/* Search/Filter Bar */}
          {activeTab === 'users' && (
            <div className="px-8 py-6">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="BUSCAR POR NOME OU E-MAIL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-3xl py-4 pl-16 pr-8 text-xs font-black uppercase tracking-widest focus:border-indigo-400 focus:outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {/* List Wrapper */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Activity className="w-10 h-10 text-slate-200 animate-pulse" />
              </div>
            ) : activeTab === 'scholarships' ? (
              <div className="p-8 space-y-10">
                {/* Scholarship Configuration */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-100/50">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100">
                        <Settings className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Configuração de Benefícios</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Defina o valor base e regras para concessão de bolsas</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valor Mensal (R$)</label>
                       <input 
                         type="number"
                         value={editingConfig.monthlyValue}
                         onChange={e => setEditingConfig(p => ({ ...p, monthlyValue: e.target.value }))}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Benefícios Extras</label>
                       <input 
                         value={editingConfig.benefits}
                         onChange={e => setEditingConfig(p => ({ ...p, benefits: e.target.value }))}
                         placeholder="Ex: Refeição, Transporte"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Requisito Principal</label>
                       <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl border border-emerald-100">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="text-[11px] font-black uppercase tracking-tight">Regra: 2+ Cursos (Automático)</span>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveConfig}
                    className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Salvar Alterações
                  </button>
                </div>

                {/* Eligible Students List */}
                <div>
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestão de Bolsistas</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Alunos qualificados pela regra de múltiplos cursos</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-6 py-2.5 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                         {getStudentsEligibility().filter(s => s.isEligible).length} Elegíveis Agora
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                      {getStudentsEligibility().map((student) => (
                        <div key={student.studentId} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                   {student.studentName.slice(0, 2).toUpperCase()}
                                 </div>
                                 <div>
                                   <p className="text-xs font-black text-slate-900 uppercase">{student.studentName}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                                        {student.enrolledCount} Cursos
                                      </span>
                                      {student.isEligible && (
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-emerald-100">
                                          Qualificado
                                        </span>
                                      )}
                                   </div>
                                 </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                student.currentStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                student.currentStatus === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                {student.currentStatus === 'none' ? 'Sem Bolsa' : 
                                 student.currentStatus === 'active' ? 'Ativa' : 
                                 student.currentStatus === 'pending' ? 'Pendente' : 
                                 'Suspenso'}
                              </div>
                           </div>

                           <div className="flex gap-2 pt-4 border-t border-slate-50">
                              {student.currentStatus !== 'active' ? (
                                <button 
                                  onClick={() => notifyScholarshipUpdate(student.studentId, student.studentName, student.enrolledCount, 'active')}
                                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                >
                                  Aprovar Bolsa
                                </button>
                              ) : (
                                <button 
                                  onClick={() => notifyScholarshipUpdate(student.studentId, student.studentName, student.enrolledCount, 'suspended')}
                                  className="flex-1 bg-white text-rose-600 border border-rose-100 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                                >
                                  Suspender
                                </button>
                              )}
                              <button 
                                onClick={() => notifyScholarshipUpdate(student.studentId, student.studentName, student.enrolledCount, 'cancelled')}
                                className="px-4 bg-slate-50 text-slate-400 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                              >
                                Cancelar
                              </button>
                           </div>
                        </div>
                      ))}
                      {getStudentsEligibility().length === 0 && (
                        <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                           <AlertTriangle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                           <p className="text-slate-300 font-black uppercase text-xs">Nenhum aluno atingiu os critérios para bolsa ainda</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ) : activeTab === 'users' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    {u.role === 'admin' && (
                      <div className="absolute top-0 right-0 p-4">
                        <ShieldCheck className="w-6 h-6 text-emerald-100" />
                      </div>
                    )}
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-slate-100">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{u.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight mb-3 truncate">{u.email}</p>
                        
                        <div className="flex items-center gap-2">
                           {u.email?.toLowerCase() === 'eduardofabian435@gmail.com' ? (
                             <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-900 shadow-lg shadow-slate-200">
                               Criador / Master
                             </span>
                           ) : (
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              u.role === 'admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              u.role === 'teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                               {u.role === 'admin' ? 'Administrador' : u.role === 'teacher' ? 'Professor' : 'Usuário'}
                             </span>
                           )}
                           <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-none">
                             v{u.acceptedTermsVersion || '1.0'}
                           </span>
                           <code className="text-[8px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded select-all cursor-help block mt-1 w-fit" title="User UID - Copie e use no ID do Professor no cadastro de cursos">
                             ID: {u.uid}
                           </code>
                         </div>
                       </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                        {u.email?.toLowerCase() === 'eduardofabian435@gmail.com' ? (
                          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl cursor-not-allowed" title="Conta Master Protegida">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                        ) : u.role === 'admin' ? (
                          <button 
                            onClick={() => handleToggleRole(u)}
                            className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"
                            title="Remover Admin"
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleRole(u)}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
                            title="Promover a Admin"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start gap-5 hover:border-slate-300 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{log.userName || 'Sistema'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-tight">{log.timestamp?.toDate().toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                          <Globe className="w-3 h-3" />
                          {log.ip}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          log.action.includes('DELETE') ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                          log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {log.action}
                        </span>
                        <p className="text-xs text-slate-600 font-medium truncate">{log.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Sistema de Auditoria em Tempo Real Ativo</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-slate-900 px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/10"
          >
            Sair do Painel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
