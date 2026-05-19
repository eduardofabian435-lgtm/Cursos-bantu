import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  User, 
  Phone, 
  Home, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle,
  BookOpen,
  Users,
  Wallet,
  X,
  CreditCard,
  MapPin,
  Baby,
  ShieldCheck
} from 'lucide-react';
import { createEnrollment, updateEnrollment, Enrollment } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  courseId: string;
  courseTitle: string;
  polo: 'Salvador' | 'Ilha';
  onSuccess: () => void;
  onCancel: () => void;
  enrollmentId?: string;
  initialData?: Enrollment['studentData'];
}

export const EnrollmentForm: React.FC<Props> = ({ 
  courseId, 
  courseTitle, 
  polo,
  onSuccess, 
  onCancel,
  enrollmentId,
  initialData 
}) => {
  const { user, isAdmin } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPolo, setSelectedPolo] = useState<'Salvador' | 'Ilha'>(polo);
  const defaultFormData = {
    enrollmentDate: new Date().toISOString().split('T')[0],
    fullName: '',
    birthDate: '',
    age: '',
    phone: '',
    cpf: '',
    rg: '',
    motherName: '',
    fatherName: '',
    address: '',
    neighborhood: '',
    houseNumber: '',
    landmark: '',
    schoolName: '',
    schoolGrade: '',
    shift: 'Matutino' as 'Matutino' | 'Vespertino' | 'Integral' | 'Noturno',
    integralDays: '',
    householdCount: '',
    housingCondition: 'Própria' as 'Própria' | 'Alugada' | 'Outros',
    incomePerCapita: '',
    receivesBenefit: 'NÃO' as 'SIM' | 'NÃO',
    benefitDetail: '',
    paysElectricity: 'Regularizado' as string,
    paysWater: 'Regularizado' as string,
    guardianName: '',
    guardianCpf: '',
    guardianRg: '',
  };

  const [formData, setFormData] = useState(() => {
    const data: any = { ...defaultFormData };
    if (initialData) {
      Object.keys(defaultFormData).forEach(key => {
        const val = (initialData as any)[key];
        if (val !== undefined && val !== null) {
          data[key] = val;
        }
      });
    }
    return data;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setChoice = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) {
      alert('Apenas funcionários autorizados podem realizar matrículas.');
      return;
    }

    setLoading(true);
    
    // Safety timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Tempo limite excedido. O sistema pode estar com cota limitada ou conexão instável.")), 10000)
    );

    try {
      const operation = enrollmentId ? 
        updateEnrollment(enrollmentId, { studentData: formData, polo: selectedPolo }) :
        createEnrollment({
          courseId,
          studentId: 'presential_referral',
          staffId: user.uid,
          polo: selectedPolo,
          status: 'approved',
          studentData: formData,
        });

      await Promise.race([
        operation,
        timeout
      ]);
      
      onSuccess();
    } catch (error: any) {
      console.error("Enrollment error:", error);
      let msg = 'Erro ao realizar matrícula. Verifique as permissões.';
      
      if (error instanceof Error) {
        if (error.message.includes('Quota exceeded') || error.message.includes('resource-exhausted')) {
          msg = 'Limite diário de uso do Firebase atingido. Tente novamente amanhã.';
        } else if (error.message.includes('Tempo limite')) {
          msg = error.message;
        }
      }
      
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const steps = [
    { id: 1, title: 'Básico', icon: User },
    { id: 2, title: 'Familiar', icon: Home },
    { id: 3, title: 'Escolar', icon: BookOpen },
    { id: 4, title: 'Social', icon: Wallet }
  ];

  const inputClasses = "w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none placeholder:text-slate-500 text-slate-950 shadow-sm hover:border-slate-400";
  const labelClasses = "text-[11px] uppercase tracking-[0.2em] font-black text-slate-950 mb-2.5 block ml-1";

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200 w-full max-w-2xl mx-auto overflow-hidden flex flex-col max-h-[95vh]">
      {/* Header */}
      <div className="p-10 border-b-2 border-slate-100 flex items-center justify-between bg-white relative z-10">
        <div>
          <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-none">
            {enrollmentId ? 'Editar Aluno' : 'Matrícula Presencial'}
          </h3>
          <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.25em] mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
            {courseTitle}
          </p>
        </div>
        <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-950 hover:rotate-90">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-10 pt-10 pb-8 bg-slate-50/50 border-b border-slate-100">
        <div className="flex justify-between items-center px-4 relative">
          <div className="absolute top-[22px] left-10 right-10 h-[4px] bg-slate-200 -z-0 rounded-full" />
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = s.id === step;
            const completed = s.id < step;
            return (
              <button 
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className="flex flex-col items-center gap-3.5 relative z-10 group outline-none"
              >
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-300 scale-125 ring-4 ring-white' : 
                      completed ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    <Icon className={`transition-transform duration-500 ${active ? 'scale-110' : 'scale-100'}`} size={22} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${active ? 'text-indigo-600 scale-110' : 'text-slate-600'}`}>
                    {s.title}
                  </span>
                </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
        <form id="enrollment-form" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelClasses}>Data da Matrícula</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input required type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleChange} className={`${inputClasses} pl-11`} />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelClasses}>Polo de Atendimento</label>
                    <div className="flex gap-2">
                      {(['Salvador', 'Ilha'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedPolo(p)}
                          className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all ${
                            selectedPolo === p 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Nome Completo do Aluno</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required name="fullName" value={formData.fullName} onChange={handleChange} className={`${inputClasses} pl-11`} placeholder="Ex: João da Silva Santos" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Nascimento</label>
                    <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Idade</label>
                    <input required type="number" name="age" value={formData.age} onChange={handleChange} className={inputClasses} placeholder="00" />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required name="phone" value={formData.phone} onChange={handleChange} className={`${inputClasses} pl-11`} placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>CPF</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input required name="cpf" value={formData.cpf} onChange={handleChange} className={`${inputClasses} pl-11`} placeholder="000.000.000-00" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>RG</label>
                    <input required name="rg" value={formData.rg} onChange={handleChange} className={inputClasses} placeholder="00.000.000-0" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {(parseInt(formData.age) < 18) && (
                  <div className="bg-amber-50/50 p-6 rounded-3xl border-2 border-amber-200/50 space-y-6 mb-8">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                         <ShieldCheck className="w-4 h-4" />
                       </div>
                       <div>
                         <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900">Dados do Responsável Legal</h4>
                         <p className="text-[9px] font-bold text-amber-700/70 uppercase tracking-widest mt-0.5">Obrigatório para menores de 18 anos</p>
                       </div>
                    </div>
                    
                    <div>
                      <label className={labelClasses}>Nome do Responsável</label>
                      <input 
                        required={parseInt(formData.age) < 18} 
                        name="guardianName" 
                        value={formData.guardianName} 
                        onChange={handleChange} 
                        className={`${inputClasses} bg-white`} 
                        placeholder="Ex: Maria Souza (Mãe)" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>CPF do Responsável</label>
                        <input 
                          required={parseInt(formData.age) < 18} 
                          name="guardianCpf" 
                          value={formData.guardianCpf} 
                          onChange={handleChange} 
                          className={`${inputClasses} bg-white`} 
                          placeholder="000.000.000-00" 
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>RG do Responsável</label>
                        <input 
                          required={parseInt(formData.age) < 18} 
                          name="guardianRg" 
                          value={formData.guardianRg} 
                          onChange={handleChange} 
                          className={`${inputClasses} bg-white`} 
                          placeholder="00.000.000-0" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelClasses}>Nome da Mãe</label>
                  <div className="relative">
                    <Baby className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required name="motherName" value={formData.motherName} onChange={handleChange} className={`${inputClasses} pl-11`} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Nome do Pai</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required name="fatherName" value={formData.fatherName} onChange={handleChange} className={`${inputClasses} pl-11`} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Logradouro (Rua/Avenida)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required name="address" value={formData.address} onChange={handleChange} className={`${inputClasses} pl-11`} placeholder="Ex: Rua das Flores" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Bairro</label>
                    <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} className={inputClasses} placeholder="Ex: Centro" />
                  </div>
                  <div>
                    <label className={labelClasses}>Número</label>
                    <input required name="houseNumber" value={formData.houseNumber} onChange={handleChange} className={inputClasses} placeholder="Ex: 123-A" />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Ponto de Referência</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="landmark" value={formData.landmark} onChange={handleChange} className={`${inputClasses} pl-11`} placeholder="Ex: Próximo ao mercado X" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className={labelClasses}>Nome da Escola</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required name="schoolName" value={formData.schoolName} onChange={handleChange} className={`${inputClasses} pl-11`} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Série / Ano</label>
                  <input required name="schoolGrade" value={formData.schoolGrade} onChange={handleChange} className={inputClasses} placeholder="Ex: 8º Ano do Ensino Fundamental" />
                </div>
                <div>
                  <label className={labelClasses}>Turno Escolar</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Matutino', 'Vespertino', 'Integral', 'Noturno'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setChoice('shift', option)}
                        className={`py-4 px-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border-2 transition-all duration-300 ${
                          formData.shift === option ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200 scale-105 z-10' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.shift === 'Integral' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className={labelClasses}>Quais dias da semana no Integral?</label>
                    <input name="integralDays" value={formData.integralDays} onChange={handleChange} className={inputClasses} placeholder="Ex: Segunda, Quarta e Sexta" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Habitantes na Casa</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input required type="number" name="householdCount" value={formData.householdCount} onChange={handleChange} className={`${inputClasses} pl-11`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Renda per Capita</label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input required name="incomePerCapita" value={formData.incomePerCapita} onChange={handleChange} className={`${inputClasses} pl-11`} placeholder="R$ 0,00" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Condições de Moradia</label>
                  <div className="flex gap-3">
                    {['Própria', 'Alugada', 'Outros'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setChoice('housingCondition', option)}
                        className={`flex-1 py-4 px-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border-2 transition-all duration-300 ${
                          formData.housingCondition === option ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200 scale-105 z-10' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-200">
                  <label className={labelClasses}>Recebe algum benefício social?</label>
                  <div className="flex gap-4 mb-6">
                    {['SIM', 'NÃO'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setChoice('receivesBenefit', option)}
                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-300 ${
                          formData.receivesBenefit === option ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  
                  {formData.receivesBenefit === 'SIM' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className={labelClasses}>Qual o benefício?</label>
                      <input name="benefitDetail" value={formData.benefitDetail} onChange={handleChange} className={inputClasses} placeholder="Ex: Bolsa Família" />
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                    <label className={labelClasses}>Situação da Luz</label>
                    <div className="flex gap-2">
                      {['Regularizado', 'Irregular'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setChoice('paysElectricity', option)}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all ${
                            formData.paysElectricity === option 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                    <label className={labelClasses}>Situação da Água</label>
                    <div className="flex gap-2">
                      {['Regularizado', 'Irregular'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setChoice('paysWater', option)}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all ${
                            formData.paysWater === option 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Footer */}
      <div className="p-10 border-t-2 border-slate-100 bg-white flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        {step > 1 ? (
          <button 
            type="button" 
            onClick={prevStep} 
            className="flex items-center gap-2.5 text-slate-500 font-extrabold uppercase tracking-[0.25em] text-[11px] hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : (
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-slate-400 font-extrabold uppercase tracking-[0.25em] text-[11px] hover:text-rose-600 transition-all hover:tracking-[0.3em]"
          >
            Cancelar
          </button>
        )}

        <div className="flex gap-4">
          {step < 4 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-indigo-200 hover:bg-black hover:shadow-black/20 transition-all flex items-center gap-2 group"
            >
              Próximo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              form="enrollment-form"
              type="submit" 
              disabled={loading} 
              className="bg-slate-950 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-slate-300 hover:bg-black hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? 'Processando...' : enrollmentId ? 'Salvar Alterações' : 'Finalizar Registro'}
              {!loading && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
