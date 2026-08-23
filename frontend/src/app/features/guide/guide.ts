import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-guide',
  templateUrl: './guide.html',
})
export class Guide {
  readonly stack = [
    {
      name: 'Angular 22 + TypeScript',
      layer: 'واجهة المستخدم',
      description: 'يبني صفحات الزبون ولوحات المطبخ والكاشير والإدارة داخل تطبيق SPA واحد.',
      why: 'Angular يقسم الواجهة إلى Components وServices وRoutes، وTypeScript يضيف أنواعاً تقلل أخطاء JavaScript.',
    },
    {
      name: 'ASP.NET Core 8 Web API',
      layer: 'الخلفية / API',
      description: 'يستقبل طلبات HTTP، يتحقق من البيانات والصلاحيات، ثم ينفذ أوامر المطعم.',
      why: 'الـ API هو بوابة الثقة: لا يعتمد على السعر أو الدور القادم من المتصفح.',
    },
    {
      name: 'Supabase Postgres',
      layer: 'قاعدة البيانات',
      description: 'يحفظ المستخدمين والأدوار والتصنيفات والأصناف والطلبات والتقييمات وسجل الأحداث.',
      why: 'Postgres يفرض القيود وRLS وFunctions، لذلك الحماية لا تعتمد على شكل الواجهة فقط.',
    },
    {
      name: 'Supabase Auth + JWT',
      layer: 'الهوية',
      description: 'يسجل دخول الموظفين ويصدر Session فيها JWT يرسلها Angular مع طلبات الموظفين.',
      why: 'Authentication يجيب: من أنت؟ Authorization يجيب: ماذا يسمح لك أن تفعل؟',
    },
    {
      name: 'Npgsql + SQL functions',
      layer: 'اتصال البيانات',
      description: 'الـ ASP.NET API يتصل بـ Postgres باستعلامات parameterized وبـ functions ضيقة الصلاحيات.',
      why: 'هذا يمنع SQL injection ويجعل قواعد الطلب وانتقال حالته في مكان مركزي قابل للاختبار.',
    },
    {
      name: 'Vitest + xUnit + Playwright',
      layer: 'الاختبار',
      description: 'اختبارات وحدة للواجهة والخلفية، واختبارات دخان حقيقية للمتصفح مع Angular وAPI.',
      why: 'نختبر المنطق منفرداً، ثم نختبر الرحلة من المتصفح حتى الحد الأدنى من API.',
    },
  ];

  readonly flow = [
    {
      number: '01',
      title: 'الزبون يفتح الرابط',
      body: 'QR واحد يفتح Angular. الاسم والواتساب ورقم الطاولة يدخلها الزبون يدوياً؛ لا نضع بيانات حساسة داخل QR أو URL.',
    },
    {
      number: '02',
      title: 'تحميل القائمة',
      body: 'Menu component يستدعي GET /api/public/menu. القائمة العامة تعرض الأصناف المتاحة فقط.',
    },
    {
      number: '03',
      title: 'السلة تحفظ مؤقتاً',
      body: 'CartService يستخدم sessionStorage حتى لا تختفي السلة عند الانتقال بين الصفحات في نفس جلسة المتصفح.',
    },
    {
      number: '04',
      title: 'إرسال الطلب',
      body: 'POST /api/public/orders يرسل العناصر. API يتحقق من المدخلات ويستخدم create_order() ليعيد تسعير كل عنصر من قاعدة البيانات.',
    },
    {
      number: '05',
      title: 'تتبع آمن',
      body: 'يرجع API tracking token عشوائياً. المتصفح يستخدمه لتتبع حالة طلب واحد دون كشف UUID أو بيانات شخصية.',
    },
    {
      number: '06',
      title: 'الموظفون يعالجون الطلب',
      body: 'المطبخ يغيّر الحالة إلى preparing ثم ready، والكاشير يغلق الطلب. كل شاشة محمية في Angular ومُعاد فحصها في API وPostgres.',
    },
  ];

  readonly glossary = [
    {
      term: 'Component',
      meaning: 'وحدة واجهة: ملف TypeScript للمنطق، HTML للعرض، وSCSS للتنسيق.',
      project: 'Entry وMenu وKitchen وAdmin كل منها Component مستقل.',
    },
    {
      term: 'Service + Dependency Injection',
      meaning: 'Service يحمل منطقاً قابلاً لإعادة الاستخدام، وinject() يطلبه Angular بدل إنشاء نسخة يدوياً.',
      project: 'PublicOrdersService وCartService وStaffAuthService تفصل الاتصال والحالة عن HTML.',
    },
    {
      term: 'Route وRouter Outlet',
      meaning: 'Route يربط URL بصفحة، وrouter-outlet هو المكان الذي تظهر فيه الصفحة الحالية.',
      project: '/menu و/kitchen و/admin مسارات مختلفة داخل SPA دون تحميل HTML جديد لكل انتقال.',
    },
    {
      term: 'Reactive Form',
      meaning: 'شكل بيانات تراقبه TypeScript مع Validators قبل السماح بالإرسال.',
      project: 'Entry يتحقق من الاسم والواتساب والطاولة ويعرض كل الأخطاء للمستخدم.',
    },
    {
      term: 'HTTP / REST API',
      meaning: 'طريقة تواصل عبر request وresponse: GET للقراءة، POST للإنشاء، PATCH للتعديل الجزئي.',
      project: 'Angular يطلب /api/public/menu، وASP.NET يعيد JSON مع status code مثل 200 أو 400 أو 503.',
    },
    {
      term: 'DTO / Contract',
      meaning: 'شكل البيانات المسموح بين الواجهة والـ API، وليس بالضرورة شكل جدول قاعدة البيانات.',
      project: 'CreateOrderRequest يحدد ما يحتاجه إنشاء الطلب، ولا يسمح للعميل بإرسال total موثوق.',
    },
    {
      term: 'Authentication vs Authorization',
      meaning: 'Authentication يثبت الهوية، وAuthorization يحدد الصلاحية بعد معرفة الهوية.',
      project: 'Supabase يثبت الموظف، وStaffRoleAuthorizationHandler يقرأ دوره الحالي من profiles.',
    },
    {
      term: 'JWT وInterceptor',
      meaning: 'JWT توقيع رقمي للهوية. Interceptor يضيفه تلقائياً إلى طلبات HTTP المحمية.',
      project: 'staffAuthInterceptor يرسل Authorization: Bearer، ولا يضيفه إلى صفحات الزبائن العامة.',
    },
    {
      term: 'RLS',
      meaning: 'Row Level Security: قاعدة داخل Postgres تحدد أي صفوف يستطيع كل دور قراءتها أو تعديلها.',
      project: 'العميل المجهول لا يقرأ orders مباشرة، والكاشير يغيّر availability فقط عبر function.',
    },
    {
      term: 'Migration',
      meaning: 'ملف SQL مرتب يغيّر schema بطريقة قابلة للتكرار والتتبع بين البيئات.',
      project: 'supabase/migrations يحتوي الجداول والـ enums وRLS وRPCs وإضافة idempotency.',
    },
    {
      term: 'Idempotency',
      meaning: 'تكرار نفس الطلب بسبب retry لا ينشئ نتيجة ثانية، بل يعيد نتيجة المحاولة الأولى.',
      project: 'Idempotency-Key مع request hash يمنع إنشاء طلبين إذا انقطع الاتصال بعد الضغط.',
    },
    {
      term: 'CORS وRate limiting',
      meaning: 'CORS يحدد أي origin يستطيع استدعاء API، وRate limiting يحد عدد الطلبات خلال زمن.',
      project: 'API يسمح بأصل Angular المصرح فقط ويحد إنشاء الطلبات العامة لحماية الخدمة.',
    },
  ];

  readonly codeExamples = [
    {
      title: '1) Angular Service يطلب API',
      file: 'frontend/src/app/core/public-orders.ts',
      code: `create(request: CreateOrderRequest, idempotencyKey: string) {
  return this.http.post<CreateOrderResponse>(
    '/api/public/orders',
    request,
    { headers: { 'Idempotency-Key': idempotencyKey } }
  );
}`,
      explanation: 'الـ Service يعرف كيف يتكلم مع الخادم، بينما Component يقرر متى يناديه. النوع <CreateOrderResponse> يخبر TypeScript بشكل النتيجة.',
    },
    {
      title: '2) ASP.NET Controller يتحقق قبل التخزين',
      file: 'backend/RestaurantQrOrdering.Api/Features/PublicOrders/PublicOrdersController.cs',
      code: `var errors = PublicOrderValidation.Validate(request);
if (errors.Count > 0)
    return BadRequest(new ValidationProblemDetails(errors));

await store.CreateAsync(request, token.Hash, requestHash, cancellationToken);
return StatusCode(201, new CreateOrderResponse(token.Value));`,
      explanation: 'أي شيء يأتي من المتصفح غير موثوق. لذلك التحقق في الـ API ضروري حتى لو كان Angular قد تحقق من نفس الحقول.',
    },
    {
      title: '3) حماية مسار موظف بالدور',
      file: 'frontend/src/app/app.routes.ts + backend/Program.cs',
      code: `// Angular navigation guard
{ path: 'admin', component: Admin,
  canActivate: [staffRoleGuard('admin')] }

// ASP.NET policy
[Authorize(Policy = StaffPolicies.Admin)]`,
      explanation: 'الـ guard يحسن تجربة المستخدم ويمنع التنقل غير المسموح، لكنه ليس جدار أمان. القرار الحقيقي يعاد فحصه في API ثم قاعدة البيانات.',
    },
    {
      title: '4) السعر مصدره الخادم',
      file: 'supabase/migrations/*_orders.sql',
      code: `-- الفكرة داخل create_order()
SELECT id, name, price
FROM public.menu_items
WHERE id = requested_item_id
  AND is_available = true;

-- total يحسب من price الموجود في القاعدة`,
      explanation: 'العميل يرسل item id والكمية فقط. لو أرسل سعراً مزوراً أو total منخفضاً، لا تعتمد عليه قاعدة البيانات.',
    },
  ];

  readonly interviewGroups = [
    {
      title: 'أسئلة Full Stack عامة',
      subtitle: 'ابدأ بإجابة بسيطة ثم اربطها بمشروع المطعم.',
      questions: [
        {
          question: 'اشرح رحلة الطلب من المتصفح إلى قاعدة البيانات.',
          answer: 'Angular يجمع البيانات ويرسل HTTP إلى ASP.NET. الـ API يتحقق من الطلب والصلاحيات، ثم يستدعي Store/SQL function في Supabase Postgres، وبعدها يرجع JSON وstatus code للواجهة.',
        },
        {
          question: 'ما الفرق بين frontend وbackend؟',
          answer: 'Frontend هو ما يراه المستخدم ويشغله المتصفح. Backend يعمل على الخادم ويحمي القواعد ويتصل بالبيانات. لا نضع أسرار قاعدة البيانات في frontend.',
        },
        {
          question: 'كيف تمنع المستخدم من تغيير السعر من DevTools؟',
          answer: 'لا أثق بسعر العميل. أرسل ids والكمية فقط، وcreate_order() يعيد قراءة السعر المتاح من Postgres ويحسب الإجمالي في الخادم.',
        },
        {
          question: 'ما الفرق بين 401 و403 و404 و500؟',
          answer: '401 هوية مفقودة/غير صالحة، 403 هوية صحيحة بلا صلاحية، 404 المورد غير موجود، و500 خطأ غير متوقع في الخادم.',
        },
        {
          question: 'كيف تتعامل مع فشل الشبكة بعد ضغط Place order؟',
          answer: 'أستخدم Idempotency-Key ثابتة للمحاولة. إذا أعاد المستخدم الإرسال بنفس المفتاح والبيانات، يعيد الخادم نفس الطلب بدلاً من إنشاء نسخة ثانية.',
        },
        {
          question: 'ما الاختبارات التي تكتبها؟',
          answer: 'Unit tests للـ services والتحقق، API tests لسلوك الصلاحيات والطلبات، وPlaywright لرحلة المتصفح. أضيف اختباراً لكل bug حقيقي حتى لا يعود.',
        },
      ],
    },
    {
      title: 'أسئلة ASP.NET Core',
      subtitle: 'هذه إجابات مرتبطة بالـ Web API الموجود هنا.',
      questions: [
        {
          question: 'ما هو Dependency Injection في ASP.NET؟',
          answer: 'بدل أن ينشئ Controller اتصال قاعدة البيانات بنفسه، يطلب IPublicOrderStore، وProgram.cs يحدد التنفيذ المناسب. هذا يفصل الكود ويسهل الاختبار.',
        },
        {
          question: 'ما فائدة Middleware؟',
          answer: 'Middleware مراحل تمر عليها الطلبات مثل exception handling وCORS وrate limiting وauthentication قبل الوصول إلى Controller.',
        },
        {
          question: 'كيف طبقت authorization حسب الدور؟',
          answer: 'JWT يثبت subject، وStaffRoleAuthorizationHandler يقرأ profile الحالي من قاعدة البيانات، ثم policy مثل Admin أو Kitchen تسمح أو ترفض.',
        },
        {
          question: 'لماذا تستخدم async وCancellationToken؟',
          answer: 'اتصال قاعدة البيانات I/O ولا يجب أن يحجز thread بلا داعٍ. CancellationToken يوقف العمل إذا أغلق العميل الاتصال أو انتهى الطلب.',
        },
        {
          question: 'لماذا لا تستخدم EF Core هنا؟',
          answer: 'هذا اختيار معماري: Npgsql واستعلامات parameterized وPostgres functions تعطي تحكماً مباشراً بالـ RLS والـ RPCs. EF Core خيار صالح لكنه ليس ضرورياً.',
        },
        {
          question: 'كيف تتعامل مع أخطاء API؟',
          answer: 'أعيد validation details للمدخلات، وProblemDetails للأخطاء المعروفة، وأسجل الخطأ داخلياً دون تسريب تفاصيل قاعدة البيانات للعميل.',
        },
      ],
    },
    {
      title: 'أسئلة Angular',
      subtitle: 'ركز على لماذا فصلنا المسؤوليات بهذه الطريقة.',
      questions: [
        {
          question: 'ما الفرق بين Component وService؟',
          answer: 'Component مسؤول عن العرض وتفاعل المستخدم. Service مسؤول عن بيانات أو منطق مشترك مثل CartService وPublicMenuService.',
        },
        {
          question: 'لماذا نستخدم Reactive Forms؟',
          answer: 'لأن قواعد التحقق مكتوبة في TypeScript وقابلة للاختبار، ونستطيع معرفة touched وinvalid وعرض أخطاء دقيقة قبل الإرسال.',
        },
        {
          question: 'ما وظيفة HttpInterceptor؟',
          answer: 'يمرر كل HTTP request في نقطة مشتركة. هنا يقرأ session ويضيف Bearer JWT لطلبات الموظفين بدلاً من تكرار ذلك في كل service.',
        },
        {
          question: 'ما هو Route Guard وهل يكفي للحماية؟',
          answer: 'Guard يقرر هل ينتقل المستخدم للمسار. لا يكفي وحده لأن JavaScript قابل للتعديل؛ لذلك API وPostgres يعيدان فحص الصلاحية.',
        },
        {
          question: 'ما الفرق بين Observable وPromise؟',
          answer: 'Promise نتيجة مستقبلية واحدة، أما Observable فيستطيع إصدار قيم متعددة ويمكن إلغاؤه/تركيبه مع RxJS. HttpClient يعيد Observable، وحالة auth تستخدم signals.',
        },
        {
          question: 'كيف تمنع memory leaks في polling التتبع؟',
          answer: 'Polling يتوقف عند closed أو cancelled أو not found، ولا نستمر بطلبات لا فائدة منها بعد انتهاء الحالة.',
        },
      ],
    },
    {
      title: 'أسئلة SQL وSupabase والأمان',
      subtitle: 'غالباً هذه الأسئلة تفرق بين معرفة الواجهة وفهم النظام.',
      questions: [
        {
          question: 'ما هي RLS؟',
          answer: 'سياسات صفوف داخل Postgres تحدد من يقرأ أو يغير كل صف. هي طبقة أمان مستقلة عن Angular وASP.NET.',
        },
        {
          question: 'ما الفرق بين Auth وprofiles؟',
          answer: 'Supabase Auth يحفظ الهوية والجلسة. profiles جدول التطبيق يربط user id بالدور مثل admin أو cashier أو kitchen.',
        },
        {
          question: 'ما هو SQL injection وكيف تمنعه؟',
          answer: 'هو إدخال SQL داخل نص الاستعلام. أستخدم parameters عبر Npgsql ولا أضم قيم المستخدم إلى SQL string، وأحصر الصلاحيات داخل functions.',
        },
        {
          question: 'لماذا تخزن hash للـ tracking token؟',
          answer: 'المستخدم يحتاج القيمة الأصلية للتتبع، لكن قاعدة البيانات لا تحتاج حفظها. حفظ hash يقلل أثر التسريب، وtoken عشوائي لا يحتوي PII.',
        },
        {
          question: 'ما هو migration؟',
          answer: 'نسخة من تغييرات قاعدة البيانات مرتبة في Git. بدلاً من تعديل قاعدة الإنتاج يدوياً، نطبق الملفات بنفس الترتيب على كل بيئة.',
        },
      ],
    },
  ];
}
