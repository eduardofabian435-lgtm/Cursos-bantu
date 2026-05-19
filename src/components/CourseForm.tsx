import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Image as ImageIcon, Sparkles, BookOpen, Upload } from 'lucide-react';
import { createCourse, updateCourse, Course } from '../services/db';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<Course>;
  courseId?: string;
}

export const CourseForm: React.FC<Props> = ({ onSuccess, onCancel, initialData, courseId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Tecnologia',
    polo: initialData?.polo || 'Salvador',
    duration: initialData?.duration || '',
    instructor: initialData?.instructor || '',
    instructorId: initialData?.instructorId || '',
    capacity: initialData?.capacity !== undefined ? initialData.capacity : 20,
    status: initialData?.status || 'open',
    imageUrl: initialData?.imageUrl || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Safety timeout of 10 seconds
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("O Firebase não respondeu a tempo. Geralmente isso ocorre por limite de uso (Quota) ou falta de internet.")), 10000)
    );

    try {
      if (courseId) {
        await Promise.race([
          updateCourse(courseId, formData),
          timeout
        ]);
      } else {
        await Promise.race([
          createCourse(formData),
          timeout
        ]);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving course:', error);
      let msg = 'Erro ao salvar curso.';
      if (error instanceof Error) {
        msg = error.message.includes('Quota exceeded') || error.message.includes('resource-exhausted')
          ? 'Limite de uso diário do Firebase atingido. Tente novamente em algumas horas.'
          : error.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl mx-auto flex flex-col max-h-[90vh]">
      <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {courseId ? 'Editar Curso' : 'Novo Curso'}
          </h3>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Cadastro Institucional</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        <div className="space-y-2">
          <label className="label-caps">Título do Curso</label>
          <input
            required
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            placeholder="Ex: Informática Básica"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="label-caps">Nome do Professor</label>
            <input
              required
              value={formData.instructor}
              onChange={e => setFormData(p => ({ ...p, instructor: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="Nome visível"
            />
          </div>
          <div className="space-y-2">
            <label className="label-caps">ID do Professor (Firebase UID)</label>
            <input
              value={formData.instructorId}
              onChange={e => setFormData(p => ({ ...p, instructorId: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-[10px] font-mono"
              placeholder="UID para acesso à Aba do Professor"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="label-caps">Categoria</label>
            <select
              value={formData.category}
              onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option>Tecnologia</option>
              <option>Artes</option>
              <option>Negócios</option>
              <option>Saúde</option>
              <option>Idiomas</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-caps">Polo Institucional</label>
            <select
              value={formData.polo}
              onChange={e => setFormData(p => ({ ...p, polo: e.target.value as any }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600"
            >
              <option value="Salvador">Polo Salvador</option>
              <option value="Ilha">Polo Ilha</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-caps">Duração</label>
            <input
              required
              value={formData.duration}
              onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="Ex: 3 meses"
            />
          </div>
          <div className="space-y-2">
            <label className="label-caps">Vagas</label>
            <input
              required
              type="number"
              value={formData.capacity || ''}
              onChange={e => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                setFormData(p => ({ ...p, capacity: isNaN(val) ? 0 : val }));
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="Quantidade de vagas"
            />
          </div>
          <div className="space-y-2">
            <label className="label-caps">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="open">Ativo (Inscrições Abertas)</option>
              <option value="closed">Inativo (Encerrado)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="label-caps">Descrição</label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
            placeholder="O que o aluno vai aprender?"
          />
        </div>

        <div className="space-y-4">
          <label className="label-caps text-indigo-600 font-black">Imagem do Curso</label>
          
          <div 
            onClick={() => document.getElementById('course-image-upload')?.click()}
            className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center overflow-hidden max-h-48 ${
              formData.imageUrl 
                ? 'border-indigo-200 bg-white' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
            }`}
          >
            {formData.imageUrl ? (
              <>
                <img 
                  src={formData.imageUrl} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  alt="Preview"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <div className="p-3 bg-white rounded-full text-indigo-600 shadow-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(p => ({ ...p, imageUrl: '' }));
                    }}
                    className="p-3 bg-white rounded-full text-red-500 shadow-xl hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Selecionar Imagem</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">PNG, JPG ou WEBP</p>
              </div>
            )}
            
            <input 
              id="course-image-upload"
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX_WIDTH = 800; // Resolution limit for Firestore Base64 storage
                      const MAX_HEIGHT = 600;
                      let width = img.width;
                      let height = img.height;

                      if (width > height) {
                        if (width > MAX_WIDTH) {
                          height *= MAX_WIDTH / width;
                          width = MAX_WIDTH;
                        }
                      } else {
                        if (height > MAX_HEIGHT) {
                          width *= MAX_HEIGHT / height;
                          height = MAX_HEIGHT;
                        }
                      }
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext('2d');
                      ctx?.drawImage(img, 0, 0, width, height);
                      
                      // Convert to JPEG with quality 0.7 to significantly reduce size
                      const compressed = canvas.toDataURL('image/jpeg', 0.7);
                      setFormData(p => ({ ...p, imageUrl: compressed }));
                    };
                    img.src = reader.result as string;
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
          
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tight text-center">
            Clique na área acima para carregar uma imagem
          </p>
        </div>

        <div className="sticky bottom-0 bg-white pt-6 pb-2 mt-auto border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
