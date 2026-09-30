import { USUARIO } from './base.mjs';
const agora = '2026-09-30T12:00:00.000Z';
export const TREINADOR = '00000000-0000-4000-8000-000000000002';
export const meAluno = {
  user: USUARIO,
  profile: { id: USUARIO.id, full_name: 'Maria Santos', email: USUARIO.email, avatar_url: null, created_at: agora, updated_at: agora },
  studentProfile: { user_id: USUARIO.id, birth_date: '1994-05-10', sex: 'female', weight_kg: 64, height_cm: 166, training_goal: 'hypertrophy', training_level: 'intermediate', training_profile: null, onboarding_completed_at: agora, created_at: agora, updated_at: agora },
  trainerProfile: null,
  relationships: [{ id: 'rel-1', student_user_id: USUARIO.id, trainer_user_id: TREINADOR, status: 'active', source: 'invite_link', visibility_settings: {}, approved_at: agora, started_at: agora, ended_at: null, billing_eligible_from: null, created_at: agora, updated_at: agora }],
  isStudent: true, isTrainer: false, isAdmin: false, primaryRole: 'student',
  studentOnboardingCompleted: true, trainerOnboardingCompleted: false,
  studentStats: { assignedWorkoutCount: 3, completedSessionCount: 18 },
  nextStep: 'student_home',
};

/* ─── Diário alimentar ─── */
const dia = '2026-09-30';
const item = (id, entryId, pos, name, g, kcal, p, c, f, extra = {}) => ({ id, entryId, position: pos, name, preparation: null, category: null, identification: 'identified', alternatives: [], gramsEstimated: g, gramsConfirmed: g, householdMeasure: null, confidence: 0.86, isPartiallyHidden: false, isUserAdded: false, isRemoved: false, nutritionSource: 'ai_estimated', nutritionReferenceId: null, kcalPer100g: kcal, proteinPer100g: p, carbPer100g: c, fatPer100g: f, fiberPer100g: null, ...extra });
const tot = (itens) => { const s = k => Math.round(itens.reduce((a, i) => a + i[k] * i.gramsConfirmed / 100, 0)); return { kcal: s('kcalPer100g'), proteinG: s('proteinPer100g'), carbG: s('carbPer100g'), fatG: s('fatPer100g'), fiberG: null }; };
const refeicao = (id, mealType, hora, itens) => ({ id, studentUserId: USUARIO.id, status: 'confirmed', mealType, loggedAt: `${dia}T${hora}:00-03:00`, containerSize: 'medio', mealOrigin: 'caseiro', preparationHint: null, hiddenIngredients: [], isSharedPortion: false, userNotes: null, confidence: 0.84, qualityOverall: 'good', needsRetake: false, failureReason: null, estimatedTotals: tot(itens), confirmedTotals: tot(itens), processingStartedAt: null, analyzedAt: `${dia}T${hora}:10-03:00`, confirmedAt: `${dia}T${hora}:12-03:00`, createdAt: `${dia}T${hora}:00-03:00`, updatedAt: `${dia}T${hora}:12-03:00`, items: itens });
const cafe = [item('i1', 'e1', 0, 'Pão francês', 50, 300, 8, 58, 3), item('i2', 'e1', 1, 'Ovo mexido', 100, 150, 11, 1, 11), item('i3', 'e1', 2, 'Café com leite', 200, 45, 2.5, 5, 1.6)];
const almoco = [item('i4', 'e2', 0, 'Arroz branco', 150, 128, 2.5, 28, 0.2), item('i5', 'e2', 1, 'Feijão carioca', 120, 76, 4.8, 13.6, 0.5), item('i6', 'e2', 2, 'Frango grelhado', 130, 159, 32, 0, 2.5), item('i7', 'e2', 3, 'Salada de folhas', 60, 15, 1.2, 2.5, 0.2)];
const lanche = [item('i8', 'e3', 0, 'Iogurte natural', 170, 61, 3.5, 4.7, 3.3), item('i9', 'e3', 1, 'Banana', 90, 89, 1.1, 23, 0.3)];
export const refeicoes = [refeicao('e1', 'cafe_da_manha', '07:40', cafe), refeicao('e2', 'almoco', '12:30', almoco), refeicao('e3', 'lanche', '16:10', lanche)];
const consumido = refeicoes.reduce((a, r) => a + r.confirmedTotals.kcal, 0);
const prot = refeicoes.reduce((a, r) => a + r.confirmedTotals.proteinG, 0);
const carb = refeicoes.reduce((a, r) => a + r.confirmedTotals.carbG, 0);
const gord = refeicoes.reduce((a, r) => a + r.confirmedTotals.fatG, 0);
const gasto = 320, tmb = 1420, fator = 1.375, base = Math.round(tmb * fator), gastoDia = base + gasto, alvo = gastoDia - 400;
const plano = { id: 'plano-1', status: 'active', effectiveFrom: '2026-09-01', goal: 'lose', goalLabel: 'Perder gordura', tmbKcal: tmb, tmbSource: 'scan', tmbSnapshot: { leanMassKg: 46.2, bodyFatPercent: 27.8, weightKg: 64 }, scanId: 'scan-2', routineLevel: 'light', routineLabel: 'Leve (caminhadas curtas no dia a dia)', routineFactor: fator, plannedBalanceKcal: -400, toleranceKcal: 150, createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z' };
export const diarioHoje = {
  date: dia, target: null, plan: plano,
  hud: { goal: 'lose', goalLabel: 'Perder gordura', missionLabel: 'Missão: perder gordura', status: 'below', statusLabel: 'Você ainda está abaixo da faixa de hoje', tmbKcal: tmb, routineFactor: fator, gastoBaseKcal: base, gastoDiaKcal: gastoDia, alvoCentralKcal: alvo, plannedBalanceKcal: -400, bandLowKcal: alvo - 150, bandHighKcal: alvo + 150, consumedKcal: consumido, burnedKcal: gasto, kcalToBandTop: alvo + 150 - consumido, kcalOverBandTop: 0 },
  meals: refeicoes,
  activities: [{ id: 'a1', source: 'workout_session', label: 'Treino A — Inferior', kcalBurned: gasto, loggedAt: `${dia}T07:00:00-03:00`, workoutSessionId: 's1' }],
  totals: { consumedKcal: consumido, consumedProteinG: prot, consumedCarbG: carb, consumedFatG: gord, consumedFiberG: 0, burnedKcal: gasto, remainingKcal: null },
};

/* ─── Chat com IA ─── */
const t = m => `2026-09-30T${m}:00-03:00`;
export const conversa = { id: 'c1', title: 'Treino de hoje', conversationType: 'move_ai_private', ownerUserId: USUARIO.id, studentUserId: USUARIO.id, trainerUserId: null, aiEnabled: true, waitingForTrainer: false, trainerAiMode: 'off', contextModule: null, contextLabel: null, metadata: {}, lastMessageAt: t('17:32'), createdAt: t('17:20'), updatedAt: t('17:32'), deletedAt: null };
const msg = (id, role, hora, content) => ({ id, conversationId: 'c1', role, senderUserId: role === 'user' ? USUARIO.id : null, senderName: role === 'user' ? 'Maria Santos' : null, assistantType: role === 'user' ? null : 'move_ai', isAiGenerated: role !== 'user', content, metadata: {}, readByStudentAt: t(hora), readByTrainerAt: null, createdAt: t(hora), updatedAt: t(hora), deletedAt: null });
export const mensagens = [
  msg('m1', 'user', '17:20', 'Me ajuda a entender o treino de hoje?'),
  msg('m2', 'assistant', '17:20', 'Claro! Hoje o foco é inferior: agachamento livre e stiff concentram o volume. Faça 3 séries de 8 a 10 repetições no agachamento, com 90 segundos de descanso. Se o joelho incomodar, reduza a carga e mantenha a técnica.'),
  msg('m3', 'user', '17:31', 'E o que eu como antes de treinar?'),
  msg('m4', 'assistant', '17:32', 'Pelo seu diário, ainda cabem 650 kcal na sua faixa de hoje e faltam uns 38 g de proteína. Um iogurte natural com banana, cerca de 1 hora antes, é uma boa opção.'),
];

/* ─── Treinos ─── */
const ex = (id, nome, musculo, eq, series, reps, desc, ordem) => ({ id, exerciseId: 'x' + id, exerciseName: nome, description: null, primaryMuscle: musculo, equipment: eq, mediaType: 'none', thumbnailUrl: null, imageStartUrl: null, imageEndUrl: null, sortOrder: ordem, setsCount: series, repsText: reps, restSeconds: desc, notes: null });
export const treinoA = { id: 'w1', trainerUserId: TREINADOR, title: 'Treino A — Inferior', description: 'Foco em quadríceps e posteriores.', status: 'active', assignedAt: '2026-09-02T10:00:00Z', activatedAt: '2026-09-02T10:00:00Z', exercises: [
  ex('1', 'Agachamento livre', 'Quadríceps', 'Barra', 3, '8-10', 90, 0), ex('2', 'Stiff', 'Posteriores', 'Barra', 4, '10-12', 75, 1), ex('3', 'Cadeira flexora', 'Posteriores', 'Máquina', 3, '12', 60, 2), ex('4', 'Leg press 45°', 'Quadríceps', 'Máquina', 3, '10-12', 90, 3), ex('5', 'Elevação pélvica', 'Glúteos', 'Barra', 3, '12', 60, 4), ex('6', 'Panturrilha em pé', 'Panturrilhas', 'Máquina', 4, '15', 45, 5)] };
const resumo = (w, n) => ({ id: w.id, trainerUserId: TREINADOR, studentUserId: USUARIO.id, workoutTemplateId: null, title: w.title, description: w.description, status: 'active', assignedAt: w.assignedAt, activatedAt: w.activatedAt, exerciseCount: n });
export const treinos = { items: [resumo(treinoA, 6), resumo({ ...treinoA, id: 'w2', title: 'Treino B — Superior', description: 'Peito, costas e ombros.' }, 7), resumo({ ...treinoA, id: 'w3', title: 'Treino C — Full body', description: 'Circuito para dias corridos.' }, 5)] };

export const extras = {
  'GET /api/v1/chat/conversations': { conversations: [conversa] },
  'GET /api/v1/chat/starters': { starters: [] },
  'GET /api/v1/chat/conversations/c1/messages': { messages: mensagens },
  'GET /api/v1/chat/conversations/c1': { conversation: conversa },
  'GET /api/v1/student/workouts': treinos,
  'GET /api/v1/student/workouts/w1': { workout: treinoA },
};
const serie = (n, reps, kg) => ({ studentWorkoutExerciseId: '1', setNumber: n, exerciseName: 'Agachamento livre', targetRepsText: '8-10', performedReps: reps, loadKg: kg, completed: true, notes: null });
export const extras2 = {
  'POST /api/v1/student/workouts/w1/execution': { session: { id: 's1', studentWorkoutId: 'w1', status: 'in_progress', startedAt: '2026-09-30T18:05:00-03:00', sets: [serie(1, 10, 60), serie(2, 10, 60)], nextSet: { studentWorkoutExerciseId: '1', setNumber: 3 }, totalSets: 20 } },
  'GET /api/v1/student/workouts/w1/execution': { session: null },
};

/* ─── Personal ─── */
export const mePersonal = { ...meAluno,
  profile: { ...meAluno.profile, full_name: 'Rafael Personal' },
  studentProfile: null,
  trainerProfile: { user_id: USUARIO.id, display_name: 'Rafael Personal', bio: null, specialties: ['Hipertrofia'], student_count_range: '10-30', work_model: 'presencial', invite_slug: 'rafael', is_internal_move_trainer: false, activated_at: '2026-01-01T00:00:00Z', billing_anchor_date: null, professional_title: 'Personal trainer', credentials: null, methodology: null, service_modality: null, availability: null, phone_e164: null, logo_path: null, cover_path: null, brand_color: null, whatsapp_public: false, whatsapp_message: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  relationships: [], isStudent: false, isTrainer: true, primaryRole: 'trainer', studentOnboardingCompleted: false, trainerOnboardingCompleted: true, studentStats: null, nextStep: 'trainer_home' };
const aluno = (id, nome, ultimo, dias, total, s7, titulo) => ({ studentUserId: 'st' + id, fullName: nome, email: `aluno${id}@exemplo.com`, status: 'active', lastSession: ultimo ? { id: 'ss' + id, workoutTitle: titulo, completedAt: ultimo, setCount: 18, exerciseCount: 6 } : null, completedSessionCount: total, sessionsLast7Days: s7 });
export const personal = {
  'GET /api/v1/trainer/students/activity': { students: [
    aluno(1, 'Maria Santos', '2026-09-30T19:02:00-03:00', 0, 18, 3, 'Treino A — Inferior'),
    aluno(2, 'João Pereira', '2026-09-26T07:40:00-03:00', 4, 11, 1, 'Treino C — Full body'),
    aluno(3, 'Ana Costa', '2026-09-29T18:15:00-03:00', 1, 27, 4, 'Treino B — Superior'),
    aluno(4, 'Lucas Almeida', '2026-09-18T20:10:00-03:00', 12, 6, 0, 'Treino A — Inferior'),
    aluno(5, 'Beatriz Lima', '2026-09-30T06:55:00-03:00', 0, 34, 5, 'Treino B — Superior'),
  ] },
};
const notif = (id, type, title, body, min, lida) => ({ id, recipientUserId: USUARIO.id, actorUserId: TREINADOR, type, title, body, targetPath: type === 'workout_assigned' ? '/app/treinos' : '/app/chat', targetType: null, targetEntityId: null, metadata: {}, readAt: lida ? '2026-09-30T12:00:00Z' : null, createdAt: new Date(Date.parse('2026-09-30T21:00:00Z') - min * 60000).toISOString() });
extras['GET /api/v1/notifications'] = { notifications: [
  notif('n1', 'workout_assigned', 'Novo treino disponível', 'Treino B — Superior aplicado pelo seu personal', 3, false),
  notif('n2', 'chat_message_received', 'Nova mensagem', 'Rafael: Boa! Hoje capricha na técnica do agachamento.', 120, false),
  notif('n3', 'workout_assigned', 'Novo treino disponível', 'Treino C — Full body aplicado pelo seu personal', 1440 * 2, true),
], unreadCount: 2 };
const almocoIa = [item('j1', 'e9', 0, 'Arroz branco', 150, 128, 2.5, 28, 0.2, { confidence: 0.9, householdMeasure: '4 colheres de sopa' }), item('j2', 'e9', 1, 'Feijão carioca', 120, 76, 4.8, 13.6, 0.5, { confidence: 0.86, householdMeasure: '1 concha média' }), item('j3', 'e9', 2, 'Frango grelhado', 130, 159, 32, 0, 2.5, { confidence: 0.82, householdMeasure: '1 filé médio' }), item('j4', 'e9', 3, 'Salada de folhas', 60, 15, 1.2, 2.5, 0.2, { confidence: 0.78, householdMeasure: '1 prato de sobremesa' })].map(i => ({ ...i, gramsConfirmed: null }));
const rascunho = { ...refeicao('e9', 'almoco', '12:30', []), status: 'draft', confirmedAt: null, analyzedAt: null };
extras2['POST /api/v1/food-diary/entries'] = { entry: rascunho };
extras2['POST /api/v1/food-diary/entries/e9/analyze'] = { entry: { ...rascunho, status: 'completed', qualityOverall: 'good', analyzedAt: '2026-09-30T12:31:00-03:00', items: almocoIa, estimatedTotals: tot(almocoIa.map(i => ({ ...i, gramsConfirmed: i.gramsEstimated }))) } };
