export type Locale = "en" | "ar";

export interface Dictionary {
  brand: string;
  entry: {
    title: string;
    subtitle: string;
    name: string;
    namePlaceholder: string;
    whatsapp: string;
    whatsappPlaceholder: string;
    whatsappHint: string;
    otherCountry: string;
    table: string;
    tablePlaceholder: string;
    tableHint: string;
    submit: string;
    errors: {
      nameRequired: string;
      nameTooLong: string;
      whatsappInvalid: string;
      tableRequired: string;
      tableTooLong: string;
    };
  };
  menu: {
    title: string;
    searchPlaceholder: string;
    unavailable: string;
    addToCart: string;
    viewCart: string;
    empty: string;
    allergens: string;
  };
  cart: {
    title: string;
    empty: string;
    browseMenu: string;
    quantity: string;
    remove: string;
    notes: string;
    notesPlaceholder: string;
    total: string;
    table: string;
    submit: string;
    submitting: string;
    backToMenu: string;
    errorGeneric: string;
    errorUnavailable: string;
  };
  tracker: {
    title: string;
    table: string;
    statuses: {
      new: string;
      preparing: string;
      ready: string;
      closed: string;
      cancelled: string;
    };
    statusHelp: {
      new: string;
      preparing: string;
      ready: string;
      closed: string;
      cancelled: string;
    };
    total: string;
    rate: string;
    newOrder: string;
  };
  rating: {
    title: string;
    subtitle: string;
    commentPlaceholder: string;
    submit: string;
    submitted: string;
    already: string;
  };
  lang: { en: string; ar: string };
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    brand: "Table Order",
    entry: {
      title: "Welcome — let's get your table set up",
      subtitle: "A couple of details before you browse the menu.",
      name: "Your name",
      namePlaceholder: "e.g. Sara",
      whatsapp: "WhatsApp number",
      whatsappPlaceholder: "e.g. 0791234567",
      whatsappHint: "We'll send your receipt here when your order closes.",
      otherCountry: "Other (type code)",
      table: "Table number",
      tablePlaceholder: "e.g. 12",
      tableHint: "Check the number on your table.",
      submit: "See the menu",
      errors: {
        nameRequired: "Enter your name.",
        nameTooLong: "Name is too long.",
        whatsappInvalid: "Enter a valid WhatsApp number (digits only, 7–15).",
        tableRequired: "Enter your table number.",
        tableTooLong: "Table number is too long.",
      },
    },
    menu: {
      title: "Menu",
      searchPlaceholder: "Search dishes",
      unavailable: "Currently unavailable",
      addToCart: "Add",
      viewCart: "View cart",
      empty: "No dishes match your search.",
      allergens: "Contains",
    },
    cart: {
      title: "Your order",
      empty: "Your cart is empty.",
      browseMenu: "Browse the menu",
      quantity: "Qty",
      remove: "Remove",
      notes: "Note for the kitchen (optional)",
      notesPlaceholder: "e.g. no onions",
      total: "Total",
      table: "Table",
      submit: "Send order to kitchen",
      submitting: "Sending your order…",
      backToMenu: "Add more items",
      errorGeneric: "Couldn't send your order. Please try again.",
      errorUnavailable: "One of your items just became unavailable — please review your cart.",
    },
    tracker: {
      title: "Order status",
      table: "Table",
      statuses: {
        new: "Received",
        preparing: "Preparing",
        ready: "Ready",
        closed: "Closed",
        cancelled: "Cancelled",
      },
      statusHelp: {
        new: "The kitchen has your order.",
        preparing: "Your food is being prepared.",
        ready: "Your order is ready — enjoy!",
        closed: "This order is closed. Thanks for visiting!",
        cancelled: "This order was cancelled.",
      },
      total: "Total",
      rate: "Rate your experience",
      newOrder: "Start a new order",
    },
    rating: {
      title: "How was your visit?",
      subtitle: "Your feedback helps the kitchen and the team.",
      commentPlaceholder: "Anything you'd like to share (optional)",
      submit: "Submit rating",
      submitted: "Thanks for your feedback!",
      already: "You've already rated this order.",
    },
    lang: { en: "English", ar: "العربية" },
  },
  ar: {
    brand: "طلب الطاولة",
    entry: {
      title: "أهلاً بك — لنجهز طاولتك",
      subtitle: "بيانات بسيطة قبل تصفح القائمة.",
      name: "اسمك",
      namePlaceholder: "مثال: سارة",
      whatsapp: "رقم واتساب",
      whatsappPlaceholder: "مثال: 0791234567",
      whatsappHint: "سنرسل الفاتورة عليه عند إغلاق طلبك.",
      otherCountry: "دولة أخرى (اكتب الرمز)",
      table: "رقم الطاولة",
      tablePlaceholder: "مثال: 12",
      tableHint: "تحقق من الرقم الموجود على طاولتك.",
      submit: "عرض القائمة",
      errors: {
        nameRequired: "الرجاء إدخال اسمك.",
        nameTooLong: "الاسم طويل جداً.",
        whatsappInvalid: "أدخل رقم واتساب صحيح (أرقام فقط، 7-15 رقم).",
        tableRequired: "الرجاء إدخال رقم الطاولة.",
        tableTooLong: "رقم الطاولة طويل جداً.",
      },
    },
    menu: {
      title: "القائمة",
      searchPlaceholder: "ابحث عن طبق",
      unavailable: "غير متوفر حالياً",
      addToCart: "إضافة",
      viewCart: "عرض السلة",
      empty: "لا توجد أطباق مطابقة لبحثك.",
      allergens: "يحتوي على",
    },
    cart: {
      title: "طلبك",
      empty: "سلتك فارغة.",
      browseMenu: "تصفح القائمة",
      quantity: "الكمية",
      remove: "إزالة",
      notes: "ملاحظة للمطبخ (اختياري)",
      notesPlaceholder: "مثال: بدون بصل",
      total: "المجموع",
      table: "الطاولة",
      submit: "إرسال الطلب للمطبخ",
      submitting: "جاري إرسال طلبك…",
      backToMenu: "إضافة المزيد",
      errorGeneric: "تعذّر إرسال طلبك. حاول مرة أخرى.",
      errorUnavailable: "أحد الأصناف لم يعد متوفراً — راجع سلتك من فضلك.",
    },
    tracker: {
      title: "حالة الطلب",
      table: "الطاولة",
      statuses: {
        new: "تم الاستلام",
        preparing: "قيد التحضير",
        ready: "جاهز",
        closed: "مغلق",
        cancelled: "ملغى",
      },
      statusHelp: {
        new: "المطبخ استلم طلبك.",
        preparing: "طلبك قيد التحضير.",
        ready: "طلبك جاهز — بالهناء والشفاء!",
        closed: "تم إغلاق هذا الطلب. شكراً لزيارتك!",
        cancelled: "تم إلغاء هذا الطلب.",
      },
      total: "المجموع",
      rate: "قيّم تجربتك",
      newOrder: "بدء طلب جديد",
    },
    rating: {
      title: "كيف كانت زيارتك؟",
      subtitle: "رأيك يساعد المطبخ والفريق.",
      commentPlaceholder: "أي شيء تود مشاركته (اختياري)",
      submit: "إرسال التقييم",
      submitted: "شكراً لتقييمك!",
      already: "لقد قيّمت هذا الطلب مسبقاً.",
    },
    lang: { en: "English", ar: "العربية" },
  },
};
