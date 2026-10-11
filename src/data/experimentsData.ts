import { CircuitElement, Wire } from '../engine/circuitSolver';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Experiment {
  id: string;
  number: number;
  title: string;
  titleEn: string;
  category: string;
  level: string;
  objective: string;
  tools: string[];
  schematicDescription: string;
  steps: string[];
  scientificExplanation: string;
  defaultCircuit: {
    elements: CircuitElement[];
    wires: Wire[];
  };
  quiz: QuizQuestion[];
  isPublished?: boolean;
}

export const EXPERIMENTS_LIST: Experiment[] = [
  {
    id: 'exp-1',
    number: 1,
    title: 'التعرف على مكونات الدائرة الكهربائية',
    titleEn: 'Identification of Circuit Components',
    category: 'أساسيات الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'التعرف على الرموز الهندسية والوظائف الفيزيائية للمكونات الكهربائية الأساسية (المصدر، المقاومة، المفتاح، وأسلاك التوصيل).',
    tools: ['بطارية 9V (DC Battery)', 'مقاومة كربونية 1kΩ (Resistor)', 'مفتاح تشغيل (SPST Switch)', 'مصباح إشارة (Indicator Lamp)', 'أسلاك توصيل (Jumpers)'],
    schematicDescription: 'تتكون الدائرة البسيطة من حلقة مغلقة تحتوي على مصدر طاقة ينتج فرق جهد، وحمل يستهلك الطاقة، ومفتاح للتحكم في مرور التيار.',
    steps: [
      'اسحب مصدر الجهد (بطارية 9V) إلى لوحة العمل وضعها في الجانب الأيسر.',
      'أضف مفتاح تحكم كهربائي (Switch) في مسار القطب الموجب.',
      'أضف مقاومة كهربائية بقيمة 1kΩ لحماية الدائرة.',
      'أضف مصباحًا كهربائيًا وحيدًا.',
      'وصّل الأسلاك بين أطراف المكونات بالترتيب لتكوين حلقة مغلقة.',
      'أغلق المفتاح ولاحظ تدفق التيار وإضاءة المصباح.'
    ],
    scientificExplanation: 'لكي يسري تيار كهربائي في أي نظام فيزيائي، يلزم شرطان رئيسيان: وجود فرق جهد كهربائي كافٍ (Potential Difference)، ومسار موصل مغلق متصل بين قطبي المصدر (Closed Conductive Loop).',
    defaultCircuit: {
      elements: [
        {
          id: 'b1',
          type: 'battery',
          name: 'بطارية 9V',
          x: 120,
          y: 180,
          rotation: 0,
          value: 9,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'sw1',
          type: 'switch',
          name: 'مفتاح SW1',
          x: 300,
          y: 120,
          rotation: 0,
          value: 1,
          unit: '',
          state: { isOpen: true },
          terminals: [
            { id: 't1', label: '1', relX: 10, relY: 35 },
            { id: 't2', label: '2', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'lmp1',
          type: 'lamp',
          name: 'مصباح 50Ω',
          x: 480,
          y: 180,
          rotation: 0,
          value: 50,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: 'A', relX: 15, relY: 45 },
            { id: 't2', label: 'B', relX: 65, relY: 45 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'b1', fromTermId: 't1', toCompId: 'sw1', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'sw1', fromTermId: 't2', toCompId: 'lmp1', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'lmp1', fromTermId: 't2', toCompId: 'b1', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q1-1',
        question: 'ما هو الشرط الأساسي لسريان التيار الكهربائي في الدائرة؟',
        options: ['وجود مقاومة عالية فقط', 'وجود فرق جهد ومسار مغلق موصل', 'فتح المفتاح الكهربائي', 'توصيل مصباحين على الأقل'],
        correctIndex: 1,
        explanation: 'التيار الكهربائي يتطلب فرق جهد (قوة دافعة كهربائية) ومسارًا مغلقًا مستمرًا حتى تتحرك الشحنات الكهربائية.'
      },
      {
        id: 'q1-2',
        question: 'ما وظيفة المفتاح الكهربائي (Switch) في الدائرة؟',
        options: ['زيادة الجهد الكهربائي', 'التحكم في فتح وإغلاق المسار الكهربائي', 'تحويل التيار المتردد إلى مستمر', 'قياس شدة التيار'],
        correctIndex: 1,
        explanation: 'المفتاح يعمل كقاطع للمسار: عندما يكون مفتوحًا تصبح المقاومة لانهائية وينقطع التيار، وعند غلقه تكتمل الدائرة.'
      }
    ]
  },
  {
    id: 'exp-2',
    number: 2,
    title: 'دائرة بطارية ومفتاح ومصباح',
    titleEn: 'Simple Circuit: Battery, Switch & Lamp',
    category: 'أساسيات الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'فهم سلوك الدائرة البسيطة وملاحظة تأثير المفتاح على تدفق التيار وتشغيل الحمل الكهربائي.',
    tools: ['بطارية 9V', 'مفتاح SPST', 'مصباح 60Ω', 'فولتميتر رقمي'],
    schematicDescription: 'دائرة أحادية الحلقة، الجهد الكلي للبطارية يطبق على المصباح عند غلق المفتاح، وتستهلك الطاقة بمقدار P = V²/R.',
    steps: [
      'قم بتوصيل القطب الموجب للبطارية بالطرف الأول للمفتاح.',
      'وصل الطرف الثاني للمفتاح بطرف المصباح الأول.',
      'أكمل الدائرة بتوصيل طرف المصباح الثاني بالقطب السالب للبطارية.',
      'شغّل المحاكاة وانقر على المفتاح لتبديل حالته بين الفتح والإغلاق.',
      'راقب شدة إضاءة المصباح وقراءة الجهد والتيار المستهلك.'
    ],
    scientificExplanation: 'عند إغلاق المفتاح، تتشكل دائرة مغلقة بقيمة مقاومة تعادل مقاومة المصباح R = 60Ω، فيسري تيار I = 9V / 60Ω = 0.15A (150mA)، مما يولد طاقة حرارية وضوئية P = 9 × 0.15 = 1.35W.',
    defaultCircuit: {
      elements: [
        {
          id: 'b2',
          type: 'battery',
          name: 'بطارية 9V',
          x: 120,
          y: 200,
          rotation: 0,
          value: 9,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'sw2',
          type: 'switch',
          name: 'مفتاح SW',
          x: 320,
          y: 120,
          rotation: 0,
          value: 1,
          unit: '',
          state: { isOpen: false },
          terminals: [
            { id: 't1', label: '1', relX: 10, relY: 35 },
            { id: 't2', label: '2', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'lamp2',
          type: 'lamp',
          name: 'مصباح 60Ω',
          x: 500,
          y: 200,
          rotation: 0,
          value: 60,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: 'A', relX: 15, relY: 45 },
            { id: 't2', label: 'B', relX: 65, relY: 45 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'b2', fromTermId: 't1', toCompId: 'sw2', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'sw2', fromTermId: 't2', toCompId: 'lamp2', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'lamp2', fromTermId: 't2', toCompId: 'b2', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q2-1',
        question: 'إذا كان جهد البطارية 9V ومقاومة المصباح 60Ω، فما هي شدة التيار المار عند غلق المفتاح؟',
        options: ['15 mA', '150 mA (0.15 A)', '540 mA', '1.5 A'],
        correctIndex: 1,
        explanation: 'بحسب قانون أوم: I = V / R = 9 / 60 = 0.15 A = 150 mA.'
      }
    ]
  },
  {
    id: 'exp-3',
    number: 3,
    title: 'تحقيق قانون أوم',
    titleEn: "Verification of Ohm's Law (V = I × R)",
    category: 'قوانين الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'التحقق عمليًا وحسابيًا من العلاقة الخطية بين فرق الجهد وشـدة التيار الكهربائي عند ثبوت قيمة المقاومة.',
    tools: ['وحدة تغذية مستمرة متغيرة (DC Supply)', 'مقاومة كربونية 1kΩ', 'أميتر رقمي موصل على التوالي', 'فولتميتر رقمي على التوازي'],
    schematicDescription: 'V = I × R. تغيير الجهد من 3V إلى 15V وملاحظة التغير الطردي المتناسب في شدة التيار المقاسة بالأميتر.',
    steps: [
      'قم بتوصيل مصدر الجهد بقيمة 9V.',
      'وصّل أميتر القياس على التوالي بين المصدر والمقاومة 1kΩ.',
      'وصّل فولتميتر رقمي على التوازي عبر طرفي المقاومة 1kΩ.',
      'سجّل قراءة الأميتر: يجب أن تقرأ 9.0 mA.',
      'غيّر جهد المصدر إلى 12V، ولاحظ ارتفاع التيار مباشرة إلى 12.0 mA.'
    ],
    scientificExplanation: 'ينص قانون أوم على أن شدة التيار المار في موصل تتناسب طرديًا مع فرق الجهد المطبق بين طرفيه، وعكسيًا مع مقاومته الكهربائية بشرط ثبوت درجة الحرارة: I = V / R.',
    defaultCircuit: {
      elements: [
        {
          id: 'ps3',
          type: 'dc_power_supply',
          name: 'مصدر DC (9V)',
          x: 100,
          y: 180,
          rotation: 0,
          value: 9,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'amm3',
          type: 'ammeter',
          name: 'أميتر A1',
          x: 300,
          y: 100,
          rotation: 0,
          value: 0,
          unit: 'A',
          terminals: [
            { id: 't1', label: '+', relX: 10, relY: 35 },
            { id: 't2', label: '-', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'r3',
          type: 'resistor',
          name: 'مقاومة R (1kΩ)',
          x: 500,
          y: 180,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'vm3',
          type: 'voltmeter',
          name: 'فولتميتر V1',
          x: 500,
          y: 320,
          rotation: 0,
          value: 0,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 15, relY: 20 },
            { id: 't2', label: '-', relX: 70, relY: 20 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps3', fromTermId: 't1', toCompId: 'amm3', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'amm3', fromTermId: 't2', toCompId: 'r3', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'r3', fromTermId: 't2', toCompId: 'ps3', toTermId: 't2', color: '#0284c7' },
        { id: 'w4', fromCompId: 'r3', fromTermId: 't1', toCompId: 'vm3', toTermId: 't1', color: '#f59e0b' },
        { id: 'w5', fromCompId: 'r3', fromTermId: 't2', toCompId: 'vm3', toTermId: 't2', color: '#6366f1' },
      ],
    },
    quiz: [
      {
        id: 'q3-1',
        question: 'إذا طُبق جهد قدره 9V على مقاومة قيمتها 1000Ω (1kΩ)، فما هو التيار المار؟',
        options: ['9 mA (0.009 A)', '90 mA (0.09 A)', '0.9 A', '9 A'],
        correctIndex: 0,
        explanation: 'I = V / R = 9 / 1000 = 0.009 A = 9 mA.'
      },
      {
        id: 'q3-2',
        question: 'عند مضاعفة قيمة فرق الجهد المؤثر على مقاومة ثابتة، فإن شدة التيار المار:',
        options: ['تقل إلى النصف', 'تتضاعف مرتين', 'تبقى ثابتة', 'تصبح صفرًا'],
        correctIndex: 1,
        explanation: 'العلاقة بين فرق الجهد والتيار علاقة طردية خطية بحسب قانون أوم (I ∝ V).'
      }
    ]
  },
  {
    id: 'exp-4',
    number: 4,
    title: 'توصيل المقاومات على التوالي',
    titleEn: 'Resistors in Series (Current & Voltage Division)',
    category: 'طرق التوصيل',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'إثبات أن المقاومة الكلية للتوالي هي مجموع المقاومات R_total = R1 + R2، وأن التيار موحد بينما يتجزأ الجهد.',
    tools: ['مصدر جهد 12V', 'مقاومتان R1=1kΩ و R2=1kΩ', 'أميتر', 'فولتميتر'],
    schematicDescription: 'R_eq = R1 + R2 = 2kΩ. التيار الكلي I = 12V / 2000Ω = 6mA. هبوط الجهد على كل مقاومة V = 6V.',
    steps: [
      'قم بتوصيل مصدر جهد 12V مستمر.',
      'وصّل مقاومتين كل منهما 1kΩ بالتتابع خلف بعضهما على مسار واحد.',
      'أكمل التوصيل إلى القطب السالب للمصدر.',
      'لاحظ أن التيار الكلي للدائرة هو 6mA (0.006A).',
      'قس فرق الجهد عبر كل مقاومة: ستجد 6V على R1 و 6V على R2.'
    ],
    scientificExplanation: 'في التوصيل على التوالي، يمر نفس مسار التيار في جميع العناصر المتصلة. المقاومة المكافئة تزداد (R_eq = ∑R_i)، والجهد الكلي يتوزع بنسبة المقاومات (مقسم الجهد Voltage Divider).',
    defaultCircuit: {
      elements: [
        {
          id: 'ps4',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 180,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'r4_1',
          type: 'resistor',
          name: 'R1 (1kΩ)',
          x: 300,
          y: 140,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'r4_2',
          type: 'resistor',
          name: 'R2 (1kΩ)',
          x: 480,
          y: 140,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'vm4',
          type: 'voltmeter',
          name: 'فولتميتر R1',
          x: 300,
          y: 280,
          rotation: 0,
          value: 0,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 15, relY: 20 },
            { id: 't2', label: '-', relX: 70, relY: 20 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps4', fromTermId: 't1', toCompId: 'r4_1', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'r4_1', fromTermId: 't2', toCompId: 'r4_2', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'r4_2', fromTermId: 't2', toCompId: 'ps4', toTermId: 't2', color: '#0284c7' },
        { id: 'w4', fromCompId: 'r4_1', fromTermId: 't1', toCompId: 'vm4', toTermId: 't1', color: '#f59e0b' },
        { id: 'w5', fromCompId: 'r4_1', fromTermId: 't2', toCompId: 'vm4', toTermId: 't2', color: '#6366f1' },
      ],
    },
    quiz: [
      {
        id: 'q4-1',
        question: 'عند توصيل مقاومتين 1kΩ و 1kΩ على التوالي مع مصدر 12V، ما هي قيمة التيار الكلي؟',
        options: ['12 mA', '6 mA', '24 mA', '3 mA'],
        correctIndex: 1,
        explanation: 'المقاومة الكلية = 1k + 1k = 2kΩ = 2000Ω. التيار = 12V / 2000Ω = 0.006A = 6mA.'
      },
      {
        id: 'q4-2',
        question: 'ما هو الجهد المقاس عبر كل مقاومة من المقاومتين المتماثلتين في التوالي؟',
        options: ['12V على كل مقاومة', '6V على كل مقاومة', '0V', '24V'],
        correctIndex: 1,
        explanation: 'الجهد يتوزع بالتساوي لأن المقاومتين متطابقتان: V1 = V2 = 12 / 2 = 6V.'
      }
    ]
  },
  {
    id: 'exp-5',
    number: 5,
    title: 'توصيل المقاومات على التوازي',
    titleEn: 'Resistors in Parallel (Voltage & Current Division)',
    category: 'طرق التوصيل',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'إثبات أن الجهد ثابت على كل فرع في التوازي، وأن المقاومة المكافئة تقل والتيار الكلي يتجزأ: I_total = I1 + I2.',
    tools: ['مصدر جهد 12V', 'مقاومتان R1=1kΩ و R2=1kΩ', 'أميتر رقمي', 'فولتميتر رقمي'],
    schematicDescription: '1/Req = 1/R1 + 1/R2 => Req = 500Ω. الجهد عبر كل مقاومة = 12V. تيار كل فرع = 12mA. التيار الكلي = 24mA.',
    steps: [
      'قم بتوصيل مصدر جهد 12V مستمر.',
      'اربط الطرف الأول لـ R1 والطرف الأول لـ R2 معًا بنقطة القطب الموجب.',
      'اربط الطرف الثاني لـ R1 والطرف الثاني لـ R2 معًا بنقطة القطب السالب.',
      'قس الجهد عبر كل فرع: ستلاحظ ثبوت الجهد عند 12V بالضبط.',
      'تحقق من التيار: تيار كل فرع هو 12mA، والتيار الكلي الخارج من المصدر هو 24mA.'
    ],
    scientificExplanation: 'في التوصيل على التوازي، تشترك الفروع في نفس نقطتي البداية والنهاية، لذا يكون فرق الجهد متساويًا عبر جميع الفروع. المقاومة المكافئة تكون دائمًا أصغر من أصغر مقاومة مفردة.',
    defaultCircuit: {
      elements: [
        {
          id: 'ps5',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 200,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'r5_1',
          type: 'resistor',
          name: 'R1 (1kΩ)',
          x: 360,
          y: 120,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'r5_2',
          type: 'resistor',
          name: 'R2 (1kΩ)',
          x: 360,
          y: 280,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps5', fromTermId: 't1', toCompId: 'r5_1', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'ps5', fromTermId: 't1', toCompId: 'r5_2', toTermId: 't1', color: '#ef4444' },
        { id: 'w3', fromCompId: 'r5_1', fromTermId: 't2', toCompId: 'ps5', toTermId: 't2', color: '#0284c7' },
        { id: 'w4', fromCompId: 'r5_2', fromTermId: 't2', toCompId: 'ps5', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q5-1',
        question: 'إذا وُصلت مقاومتان متساويتان بقيمة 1kΩ على التوازي مع مصدر 12V، فما هو التيار الكلي الخارج من المصدر؟',
        options: ['6 mA', '12 mA', '24 mA', '48 mA'],
        correctIndex: 2,
        explanation: 'المقاومة المكافئة = 1k / 2 = 500Ω. التيار الكلي = 12V / 500Ω = 0.024A = 24mA.'
      },
      {
        id: 'q5-2',
        question: 'ما هي ميزة توصيل الأجهزة الكهربائية في المنازل والمختبرات على التوازي؟',
        options: ['استهلاك تيار أقل', 'ثبوت الجهد على كل جهاز واستقلالية عمل كل جهاز دون تأثير إذا تعطل الآخر', 'توفير الأسلاك', 'زيادة المقاومة الكلية'],
        correctIndex: 1,
        explanation: 'في التوازي، يحصل كل جهاز على نفس الجهد، وإذا فُصل أحد الأجهزة يستمر التيار في بقية الفروع دون انقطاع.'
      }
    ]
  },
  {
    id: 'exp-6',
    number: 6,
    title: 'مقارنة التيار والجهد في التوالي والتوازي',
    titleEn: 'Series vs Parallel Comparison',
    category: 'طرق التوصيل',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'المقارنة المباشرة والشاملة بين خصائص التوصيل على التوالي والتوازي من حيث التيار، الجهد، والمقاومة الكلية.',
    tools: ['مصدر تغذية 12V', '4 مقاومات 1kΩ', 'أميتر رقمي', 'فولتميتر رقمي'],
    schematicDescription: 'مقارنة فرع توالي وفرع توازي: التوالي يعطي مقاومة أعلى وتيارًا أقل، والتوازي يعطي مقاومة أقل وتيارًا كليًا أكبر.',
    steps: [
      'قم بإنشاء فرع توالي (مقاومتان 1kΩ) وفرع توازي (مقاومتان 1kΩ).',
      'طبّق جهد 12V ولاحظ الفارق بين الفرعين.',
      'في فرع التوالي: التيار 6mA وهبوط الجهد 6V على كل عنصر.',
      'في فرع التوازي: التيار الكلي 24mA والجهد ثابت 12V على كل عنصر.'
    ],
    scientificExplanation: 'الجدول الهندسي للمقارنة:\n- التوالي: التيار ثابت، الجهد يتجزأ، R_eq تزداد.\n- التوازي: الجهد ثابت، التيار يتجزأ، R_eq تقل.',
    defaultCircuit: {
      elements: [
        {
          id: 'ps6',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 200,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'r6_s1',
          type: 'resistor',
          name: 'توالي R1 (1kΩ)',
          x: 280,
          y: 120,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'r6_s2',
          type: 'resistor',
          name: 'توالي R2 (1kΩ)',
          x: 440,
          y: 120,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps6', fromTermId: 't1', toCompId: 'r6_s1', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'r6_s1', fromTermId: 't2', toCompId: 'r6_s2', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'r6_s2', fromTermId: 't2', toCompId: 'ps6', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q6-1',
        question: 'إذا احترقت إحدى المقاومات (أصبحت دائرة مفتوحة) في دائرة توالي، ماذا يحدث لبقية الدائرة؟',
        options: ['يزداد التيار في بقية المقاومات', 'ينقطع التيار تمامًا وتتوقف الدائرة', 'يبقى الجهد ثابتًا', 'تحترق المقاومات الأخرى'],
        correctIndex: 1,
        explanation: 'في التوالي، يوجد مسار واحد فقط للتيار؛ فإذا انقطع في أي نقطة أصبحت الدائرة مفتوحة تمامًا وتوقف تدفق الشحنات.'
      }
    ]
  },
  {
    id: 'exp-7',
    number: 7,
    title: 'قانون كيرشوف للتيار (KCL)',
    titleEn: "Kirchhoff's Current Law (KCL)",
    category: 'قوانين الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'إثبات أن مجموع التيارات الداخلة إلى أي عقدة كهربائية يساوي مجموع التيارات الخارجة منها: ∑I_in = ∑I_out.',
    tools: ['مصدر جهد 12V', '3 مقاومات (R1=500Ω, R2=1kΩ, R3=1kΩ)', 'أميترات قياس الفروع'],
    schematicDescription: 'قانون حفظ الشحنة الكهربائية: عند العقدة N1، التيار الداخل I_total يتفرع إلى I1 و I2، بحيث I_total = I1 + I2.',
    steps: [
      'قم بتوصيل مصدر جهد 12V.',
      'وصّل تفرعًا عند عقدة مركزية يتوزع إلى مقاومتين 1kΩ متوازيتين.',
      'راقب قراءة التيار الداخل إلى العقدة: 24 mA.',
      'راقب قراءة التيار في الفرع الأول: 12 mA، وفي الفرع الثاني: 12 mA.',
      'تحقق من المعادلة: 24 mA = 12 mA + 12 mA.'
    ],
    scientificExplanation: 'ينص قانون كيرشوف للتيار (KCL) على أن المجموع الجبري للتيارات عند أي عقدة في شبكة كهربائية يساوي صفرًا (∑I = 0). يعبر هذا المبدأ فيزيائيًا عن قانون بقاء الشحنة (Conservation of Electric Charge).',
    defaultCircuit: {
      elements: [
        {
          id: 'ps7',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 200,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'amm7_main',
          type: 'ammeter',
          name: 'أميتر كلي (I_in)',
          x: 260,
          y: 120,
          rotation: 0,
          value: 0,
          unit: 'A',
          terminals: [
            { id: 't1', label: '+', relX: 10, relY: 35 },
            { id: 't2', label: '-', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'r7_1',
          type: 'resistor',
          name: 'فرع 1 (1kΩ)',
          x: 460,
          y: 100,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'r7_2',
          type: 'resistor',
          name: 'فرع 2 (1kΩ)',
          x: 460,
          y: 240,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps7', fromTermId: 't1', toCompId: 'amm7_main', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'amm7_main', fromTermId: 't2', toCompId: 'r7_1', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'amm7_main', fromTermId: 't2', toCompId: 'r7_2', toTermId: 't1', color: '#10b981' },
        { id: 'w4', fromCompId: 'r7_1', fromTermId: 't2', toCompId: 'ps7', toTermId: 't2', color: '#0284c7' },
        { id: 'w5', fromCompId: 'r7_2', fromTermId: 't2', toCompId: 'ps7', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q7-1',
        question: 'إذا دخل تيار مقداره 30mA إلى عقدة وتفرع إلى فرعين، وكان تيار الفرع الأول 18mA، فما هو تيار الفرع الثاني؟',
        options: ['48 mA', '12 mA', '18 mA', '30 mA'],
        correctIndex: 1,
        explanation: 'بحسب قانون كيرشوف للتيار: I_in = I1 + I2 => 30 = 18 + I2 => I2 = 30 - 18 = 12 mA.'
      }
    ]
  },
  {
    id: 'exp-8',
    number: 8,
    title: 'قانون كيرشوف للجهد (KVL)',
    titleEn: "Kirchhoff's Voltage Law (KVL)",
    category: 'قوانين الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'إثبات أن المجموع الجبري لفروق الجهد في أي مسار مغلق (Loop) يساوي صفرًا: ∑V = 0.',
    tools: ['مصدر جهد 15V', '3 مقاومات مختلفة (R1=500Ω, R2=1kΩ, R3=1.5kΩ)', 'فولتميترات'],
    schematicDescription: 'قانون حفظ الطاقة: جهد المصدر V_source = V_R1 + V_R2 + V_R3 في الحلقة المغلقة.',
    steps: [
      'وصّل مصدر جهد 12V مع مقاومتين 1kΩ على التوالي.',
      'قس جهد المصدر: V_s = 12V.',
      'قس هبوط الجهد على المقاومة الأولى: V1 = 6V.',
      'قس هبوط الجهد على المقاومة الثانية: V2 = 6V.',
      'تحقق من المعادلة: V_s - V1 - V2 = 12 - 6 - 6 = 0V.'
    ],
    scientificExplanation: 'ينص قانون كيرشوف للجهد (KVL) على أن المجموع الجبري للقوى الدافعة الكهربائية وفروق الجهد عبر أي مسار مغلق يساوي صفرًا. هذا المبدأ نابع مباشرة من مبدأ بقاء الطاقة (Conservation of Energy).',
    defaultCircuit: {
      elements: [
        {
          id: 'ps8',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 200,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'r8_1',
          type: 'resistor',
          name: 'R1 (1kΩ)',
          x: 300,
          y: 120,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'r8_2',
          type: 'resistor',
          name: 'R2 (1kΩ)',
          x: 480,
          y: 120,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps8', fromTermId: 't1', toCompId: 'r8_1', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'r8_1', fromTermId: 't2', toCompId: 'r8_2', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'r8_2', fromTermId: 't2', toCompId: 'ps8', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q8-1',
        question: 'في حلقة مغلقة تحتوي على مصدر 10V ومقاومتين على التوالي، إذا كان هبوط الجهد على الأولى 4V، فما هو الجهد على الثانية؟',
        options: ['14 V', '6 V', '4 V', '10 V'],
        correctIndex: 1,
        explanation: 'بحسب KVL: V_source = V1 + V2 => 10 = 4 + V2 => V2 = 10 - 4 = 6V.'
      }
    ]
  },
  {
    id: 'exp-9',
    number: 9,
    title: 'قياس المقاومة بالملتيميتر',
    titleEn: 'Measuring Resistance with Multimeter (Ohmmeter)',
    category: 'القياس والحماية',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'التدريب على استخدام جهاز القياس الرقمي المتعدد (DMM) في وضع الأوميتر لقياس قيم المقاومات وتحذيرات السلامة.',
    tools: ['ملتيميتر رقمي DMM', 'مقاومة 1kΩ', 'مقاومة متغيرة Potentiometer'],
    schematicDescription: 'قياس المقاومة يتطلب فصل مصدر الجهد تمامًا عن المكون قبل القياس لتجنب تلف جهاز القياس أو إعطاء نتائج مضللة.',
    steps: [
      'اضبط وضع الملتيميتر على قياس المقاومة (Ω).',
      'تأكد من عدم وجود أي مصدر جهد متصل بالمقاومة.',
      'وصّل مجسي القياس بطرفي المقاومة.',
      'اقرأ القيمة المباشرة على شاشة الملتيميتر الرقمية.'
    ],
    scientificExplanation: 'يعمل مقياس المقاومة (Ohmmeter) عن طريق ضخ تيار صغير معروف من بطاريته الداخلية وقياس هبوط الجهد الناتج وحساب R = V/I. إذا كانت الدائرة متصلة بمصدر خارجي، فإن هذا الجهد الخارجي سيعبث بالقياس أو يتلف الدائرة الداخلية للمقياس.',
    defaultCircuit: {
      elements: [
        {
          id: 'dmm9',
          type: 'multimeter',
          name: 'ملتيميتر رقمي',
          x: 200,
          y: 150,
          rotation: 0,
          value: 0,
          unit: 'Ω',
          state: { mode: 'resistance' },
          terminals: [
            { id: 't1', label: '+', relX: 15, relY: 35 },
            { id: 't2', label: '-', relX: 75, relY: 35 },
          ],
        },
        {
          id: 'r9',
          type: 'resistor',
          name: 'مقاومة للاختبار (1kΩ)',
          x: 450,
          y: 150,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'dmm9', fromTermId: 't1', toCompId: 'r9', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'dmm9', fromTermId: 't2', toCompId: 'r9', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q9-1',
        question: 'لماذا يجب فصل مصدر الطاقة عن الدائرة قبل قياس المقاومة بالأوميتر؟',
        options: ['لتوفير بطارية الملتيميتر', 'لحماية جهاز القياس ومنع قراءات خاطئة نتيجة تداخل الجهد الخارجي', 'لأن المقاومة تختفي مع وجود الجهد', 'لتبريد المقاومة'],
        correctIndex: 1,
        explanation: 'الأوميتر يضخ تيارًا داخليًا من بطاريته لحساب المقاومة، ووجود جهد خارجي يتلف الملتيميتر ويعطي قراءات غير صحيحة.'
      }
    ]
  },
  {
    id: 'exp-10',
    number: 10,
    title: 'توصيل LED مع مقاومة حماية',
    titleEn: 'LED with Current-Limiting Resistor',
    category: 'الإلكترونيات',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'فهم طريقة انحياز الدايود المشع للضوء (LED)، وحساب قيمة مقاومة الحماية للحد من التيار وتجنب احتراق الـ LED.',
    tools: ['بطارية 9V', 'مقاومة حماية 330Ω (Resistor)', 'دايود مشع LED أحمر'],
    schematicDescription: 'R_limit = (V_supply - V_led) / I_led = (9V - 2V) / 0.02A = 350Ω => اختيار مقاومة قياسية 330Ω أو 470Ω.',
    steps: [
      'وصّل الطرف الموجب لمصدر الجهد بالمقاومة المحددة للتيار (330Ω).',
      'وصّل الطرف الآخر للمقاومة بالمصعد (Anode) للدايود المشع للضوء.',
      'وصّل مهبط (Cathode) الـ LED بالقطب السالب للمصدر.',
      'لاحظ إضاءة الـ LED وحساب هبوط الجهد والتيار الآمن المار فيه (حوالي 20mA).'
    ],
    scientificExplanation: 'الـ LED عنصر إلكتروني غير خطي (Non-linear) ذو مقاومة ديناميكية منخفضة جدًا بعد جهد العتبة (Forward Voltage ~2V). بدون مقاومة حماية على التوالي، سيمر تيار هائل يؤدي إلى احتراق الوصلة فورًا بفعل التأثير الحراري.',
    defaultCircuit: {
      elements: [
        {
          id: 'b10',
          type: 'battery',
          name: 'بطارية 9V',
          x: 100,
          y: 180,
          rotation: 0,
          value: 9,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'r10',
          type: 'resistor',
          name: 'مقاومة حماية (330Ω)',
          x: 300,
          y: 140,
          rotation: 0,
          value: 330,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'led10',
          type: 'led',
          name: 'LED أحمر',
          x: 480,
          y: 140,
          rotation: 0,
          value: 2.0,
          unit: 'V',
          state: { color: 'red' },
          terminals: [
            { id: 't1', label: 'A (+)', relX: 15, relY: 40 },
            { id: 't2', label: 'K (-)', relX: 65, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'b10', fromTermId: 't1', toCompId: 'r10', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'r10', fromTermId: 't2', toCompId: 'led10', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'led10', fromTermId: 't2', toCompId: 'b10', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q10-1',
        question: 'ما هي النتيجة الحتمية لتوصيل LED بجهد 9V مباشرة دون مقاومة تحديد تيار؟',
        options: ['يضيء بضوء خافت', 'يحترق الـ LED فورًا بسبب مرور تيار زائد يفوق قدرته', 'يعمل بشكل طبيعي', 'ينعكس اتجاه التيار'],
        correctIndex: 1,
        explanation: 'الـ LED ليس لديه مقاومة داخلية كافية لكبح التيار بعد تجاوز جهد العتبة (Forward Voltage)، فيمر تيار عالي يحرقه مباشرة.'
      }
    ]
  },
  {
    id: 'exp-11',
    number: 11,
    title: 'الدائرة المفتوحة والدائرة المغلقة',
    titleEn: 'Open vs Closed Circuit Detection',
    category: 'أساسيات الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'التمييز بين الحالات الثلاث للدائرة (دائرة مغلقة، دائرة مفتوحة، دائرة قصر) وقياس الجهد والتيار في كل حالة.',
    tools: ['مصدر 9V', 'مفتاح قاطع', 'مصباح', 'فولتميتر وأميتر'],
    schematicDescription: 'في الدائرة المغلقة: I > 0 وتعمل الأحمال. في الدائرة المفتوحة: I = 0 ويكون جهد المصدر كاملًا مسلطًا عبر طرفي القاطع المفتوح.',
    steps: [
      'شغّل المحاكاة مع إبقاء المفتاح مفتوحًا: لاحظ أن التيار = 0 mA والمصباح مطفأ.',
      'قس فرق الجهد عبر طرفي المفتاح المفتوح: ستجد أنه يساوي جهد المصدر (9V).',
      'أغلق المفتاح: يصبح هبوط الجهد عبر المفتاح 0V ويسري التيار ويضيء المصباح.'
    ],
    scientificExplanation: 'في الدائرة المفتوحة (Open Circuit)، تكون المقاومة المكافئة لانهائية (R = ∞)، وبالتالي ينعدم التيار (I = 0)، بينما يظهر جهد المصدر بالكامل عبر نقطتي الانقطاع.',
    defaultCircuit: {
      elements: [
        {
          id: 'b11',
          type: 'battery',
          name: 'بطارية 9V',
          x: 100,
          y: 200,
          rotation: 0,
          value: 9,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'sw11',
          type: 'switch',
          name: 'مفتاح SW',
          x: 300,
          y: 120,
          rotation: 0,
          value: 1,
          unit: '',
          state: { isOpen: true },
          terminals: [
            { id: 't1', label: '1', relX: 10, relY: 35 },
            { id: 't2', label: '2', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'lmp11',
          type: 'lamp',
          name: 'مصباح حمل',
          x: 480,
          y: 200,
          rotation: 0,
          value: 50,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: 'A', relX: 15, relY: 45 },
            { id: 't2', label: 'B', relX: 65, relY: 45 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'b11', fromTermId: 't1', toCompId: 'sw11', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'sw11', fromTermId: 't2', toCompId: 'lmp11', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'lmp11', fromTermId: 't2', toCompId: 'b11', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q11-1',
        question: 'كم تبلغ قيمة شدة التيار المار في دائرة كهربائية مفتوحة؟',
        options: ['أقصى قيمة ممكنة', 'صفر أمبير', 'نصف قيمة الجهد', 'تعتمد على حجم السلك'],
        correctIndex: 1,
        explanation: 'في الدائرة المفتوحة تنقطع حلقة سريان الشحنات وتصبح المقاومة لانهائية فيكون التيار صفرًا.'
      }
    ]
  },
  {
    id: 'exp-12',
    number: 12,
    title: 'اكتشاف القصر الكهربائي وفيوز الحماية',
    titleEn: 'Short Circuit Detection & Fuse Protection',
    category: 'القياس والحماية',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'التعرف على مخاطر القصر الكهربائي (Short Circuit) وكيفية حماية الدوائر الحساسة بواسطة المنصهر الكهربائي (Fuse).',
    tools: ['مصدر جهد 12V', 'فيوز حماية 0.5A (Fuse)', 'مقاومة حمل 100Ω', 'سلك قصر تجريبي'],
    schematicDescription: 'عند حدوث قصر بين طرفي الحمل، تنخفض المقاومة إلى الصفر تقريبًا، فيرتفع التيار بشكل هائل مسببًا انصهار الفيوز وحماية المصدر.',
    steps: [
      'وصّل فيوز الحماية (0.5A) على التوالي مع الحمل (مقاومة 100Ω).',
      'في الحالة العادية: التيار = 12V / 100Ω = 0.12A (120mA)، والفيوز سليم.',
      'جرّب توصيل سلك قصر مباشر عبر طرفي الحمل بالتوازي.',
      'راقب ارتفاع التيار الفوري ثم احتراق الفيوز وفصل الدائرة بالكامل لحماية مصدر الجهد.'
    ],
    scientificExplanation: 'القصر الكهربائي (Short Circuit) هو اتصال غير مقصود منخفض المقاومة بين نقطتين ذات فرق جهد. بحسب I = V/R، عندما تقترب R من الصفر يقترب التيار من ما لانهاية، مما يولد حرارة هائلة قد تسبب حرائق أو تلف مصادر التغذية. لذلك تستخدم عناصر الحماية كالفيوزات وقواطع الدورة.',
    defaultCircuit: {
      elements: [
        {
          id: 'ps12',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 200,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'fuse12',
          type: 'fuse',
          name: 'فيوز حماية (0.5A)',
          x: 280,
          y: 120,
          rotation: 0,
          value: 0.5,
          unit: 'A',
          state: { isBlown: false },
          terminals: [
            { id: 't1', label: '1', relX: 10, relY: 35 },
            { id: 't2', label: '2', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'r12',
          type: 'resistor',
          name: 'حمل R (100Ω)',
          x: 480,
          y: 200,
          rotation: 0,
          value: 100,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps12', fromTermId: 't1', toCompId: 'fuse12', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'fuse12', fromTermId: 't2', toCompId: 'r12', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'r12', fromTermId: 't2', toCompId: 'ps12', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q12-1',
        question: 'كيف يتصرف فيوز الحماية الكهربائي عند مرور تيار يتجاوز قيمته المقننة؟',
        options: ['يقلل الجهد إلى الصفر ويعود للعمل', 'ينصهر السلك الداخلي ويتحول إلى دائرة مفتوحة لحماية الأجهزة', 'يزيد المقاومة بشكل مؤقت', 'يطلق تيارًا عكسيًا'],
        correctIndex: 1,
        explanation: 'الفيوز يحتوي على سلك معدني ذو نقطة انصهار دقيقة؛ فإذا تجاوز التيار الحد المسموح، يولد حرارة تصهره ويقطع الدائرة بشكل نهائي.'
      }
    ]
  },
  {
    id: 'exp-13',
    number: 13,
    title: 'التدريب على الأميتر والفولتميتر',
    titleEn: 'Ammeter & Voltmeter Proper Connection Training',
    category: 'القياس والحماية',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'التمييز بين التوصيل الصحيح والخاطئ لأجهزة القياس: الأميتر على التوالي والفولتميتر على التوازي.',
    tools: ['مصدر 9V', 'مقاومة 1kΩ', 'أميتر رقمي', 'فولتميتر رقمي'],
    schematicDescription: 'الأميتر يوصل على التوالي لأن مقاومته الداخلية تقترب من الصفر (0Ω). الفولتميتر يوصل على التوازي لأن مقاومته الداخلية تقترب من اللانهاية (∞Ω).',
    steps: [
      'وصّل الأميتر في المسار التسلسلي بين البطارية والمقاومة لقياس التيار المار في الفرع.',
      'وصّل الفولتميتر بين نقطتي المقاومة على التوازي لقياس فرق الجهد بينهما.',
      'لاحظ التنبيه التعليمي إذا حاولت توصيل الأميتر بالتوازي (قصر كهربائي) أو الفولتميتر بالتوالي (قطع مسار التيار).'
    ],
    scientificExplanation: 'لعدم التأثير على قياسات الدائرة الكهربائية:\n1. الأميتر له مقاومة داخلية متناهية الصغر (Ideal R_A = 0) لكي لا يسبب هبوط جهد إضافي في المسار.\n2. الفولتميتر له مقاومة داخلية متناهية الكبر (Ideal R_V = ∞) لكي لا يسحب أي تيار من العقدة المقاسة.',
    defaultCircuit: {
      elements: [
        {
          id: 'b13',
          type: 'battery',
          name: 'بطارية 9V',
          x: 100,
          y: 180,
          rotation: 0,
          value: 9,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'amm13',
          type: 'ammeter',
          name: 'أميتر على التوالي',
          x: 280,
          y: 100,
          rotation: 0,
          value: 0,
          unit: 'A',
          terminals: [
            { id: 't1', label: '+', relX: 10, relY: 35 },
            { id: 't2', label: '-', relX: 70, relY: 35 },
          ],
        },
        {
          id: 'r13',
          type: 'resistor',
          name: 'مقاومة R (1kΩ)',
          x: 480,
          y: 180,
          rotation: 0,
          value: 1000,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: '1', relX: 15, relY: 40 },
            { id: 't2', label: '2', relX: 70, relY: 40 },
          ],
        },
        {
          id: 'vm13',
          type: 'voltmeter',
          name: 'فولتميتر على التوازي',
          x: 480,
          y: 320,
          rotation: 0,
          value: 0,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 15, relY: 20 },
            { id: 't2', label: '-', relX: 70, relY: 20 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'b13', fromTermId: 't1', toCompId: 'amm13', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'amm13', fromTermId: 't2', toCompId: 'r13', toTermId: 't1', color: '#10b981' },
        { id: 'w3', fromCompId: 'r13', fromTermId: 't2', toCompId: 'b13', toTermId: 't2', color: '#0284c7' },
        { id: 'w4', fromCompId: 'r13', fromTermId: 't1', toCompId: 'vm13', toTermId: 't1', color: '#f59e0b' },
        { id: 'w5', fromCompId: 'r13', fromTermId: 't2', toCompId: 'vm13', toTermId: 't2', color: '#6366f1' },
      ],
    },
    quiz: [
      {
        id: 'q13-1',
        question: 'كيف يجب توصيل مقياس الأميتر والفولتميتر في الدائرة الكهربائية؟',
        options: ['كلاهما على التوازي', 'كلاهما على التوالي', 'الأميتر على التوالي والفولتميتر على التوازي', 'الأميتر على التوازي والفولتميتر على التوالي'],
        correctIndex: 2,
        explanation: 'الأميتر يوصل على التوالي لقياس تدفق التيار في المسار، بينما يوصل الفولتميتر على التوازي لقياس فرق الجهد بين نقطتين.'
      }
    ]
  },
  {
    id: 'exp-14',
    number: 14,
    title: 'حساب القدرة الكهربائية',
    titleEn: 'Electrical Power Calculation (P = V × I)',
    category: 'أساسيات الدوائر',
    level: 'السنة الأولى - ميكاترونكس',
    objective: 'فهم قانون جول للقدرة الكهربائية P = V × I = I² × R = V² / R وربطها بكمية الحرارة والضوء الناتجة.',
    tools: ['مصدر جهد 12V', 'مصباح كهربائي 60Ω', 'مقاومة قدرة 100Ω', 'أجهزة قياس الجهد والتيار'],
    schematicDescription: 'P = V × I (واط W). قياس الجهد والتيار وحساب القدرة المستهلكة في الحمل والتأكد من تطابق الحسابات.',
    steps: [
      'وصّل مصدر جهد 12V بمصباح كهربائي مقاومته 60Ω.',
      'احسب شدة التيار المتوقعة: I = 12 / 60 = 0.2A (200mA).',
      'احسب القدرة الكهربائية: P = 12V × 0.2A = 2.4 Watt.',
      'لاحظ إضاءة المصباح ومطابقة قراءات عداد القدرة مع الحسابات الرياضية.'
    ],
    scientificExplanation: 'القدرة الكهربائية تعبر عن معدل بذل الشغل أو تحويل الطاقة في وحدة الزمن وتقاس بالواط (Watt = Joule/sec). في الأحمال الأومية تتحول الطاقة الكهربائية إلى حرارة وإشعاع ضوئي طبقًا لتأثير جول الحراري.',
    defaultCircuit: {
      elements: [
        {
          id: 'ps14',
          type: 'dc_power_supply',
          name: 'مصدر DC (12V)',
          x: 100,
          y: 200,
          rotation: 0,
          value: 12,
          unit: 'V',
          terminals: [
            { id: 't1', label: '+', relX: 45, relY: 10 },
            { id: 't2', label: '-', relX: 45, relY: 85 },
          ],
        },
        {
          id: 'lamp14',
          type: 'lamp',
          name: 'مصباح 60Ω',
          x: 400,
          y: 200,
          rotation: 0,
          value: 60,
          unit: 'Ω',
          terminals: [
            { id: 't1', label: 'A', relX: 15, relY: 45 },
            { id: 't2', label: 'B', relX: 65, relY: 45 },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromCompId: 'ps14', fromTermId: 't1', toCompId: 'lamp14', toTermId: 't1', color: '#ef4444' },
        { id: 'w2', fromCompId: 'lamp14', fromTermId: 't2', toCompId: 'ps14', toTermId: 't2', color: '#0284c7' },
      ],
    },
    quiz: [
      {
        id: 'q14-1',
        question: 'إذا كان فرق الجهد عبر مصباح 12V والتيار المار فيه 0.2A، فكم تبلغ القدرة الكهربائية المستهلكة؟',
        options: ['2.4 W', '60 W', '0.24 W', '24 W'],
        correctIndex: 0,
        explanation: 'بحسب قانون القدرة: P = V × I = 12 × 0.2 = 2.4 Watt.'
      }
    ]
  }
];
