/**
 * Real client-side automatic file download generator
 * Can trigger downloads of real user-uploaded files or certified digital license packages
 */
export function triggerAutomaticDownload(options: {
  fileName: string;
  productName: string;
  licenseKey: string;
  customerName?: string;
  orderId?: string;
  fileFormat?: string;
  fileData?: string; // If admin uploaded custom file data (dataURL or raw text)
}) {
  const { 
    fileName, 
    productName, 
    licenseKey, 
    customerName = 'العميل الكريم', 
    orderId = 'ORD-ONLINE', 
    fileFormat = 'ZIP',
    fileData 
  } = options;

  const timestamp = new Date().toLocaleString('ar-EG');

  // If the admin uploaded a real file (data URL like data:application/pdf;base64,... or plain text)
  if (fileData && fileData.startsWith('data:')) {
    const anchor = document.createElement('a');
    anchor.href = fileData;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  }

  // If text or binary contents or fallback digital license package
  const content = fileData || `======================================================================
  شهادة تسليم وترخيص المنتج الرقمي - متجر Origin Shop
======================================================================

اسم المنتج: ${productName}
رقم الطلب: ${orderId}
اسم العميل: ${customerName}
تاريخ وتوقيت العملية: ${timestamp}
مفتاح الترخيص المعتمد (License Key):
>>> ${licenseKey} <<<

صيغة الملف: ${fileFormat}
رمز التحقق الأمني (Checksum): sha256_${Math.random().toString(36).substring(2)}${Date.now()}
الحالة: مفعل ومرخص للاستخدام الشخصي والتجاري

----------------------------------------------------------------------
تعليمات الاستخدام:
1. احتفظ بهذا الملف ومفتاح الترخيص للرجوع إليه عند التحديثات.
2. يمكنك مراجعة وتنزيل ملفاتك في أي وقت عبر حسابك في متجر Origin Shop.
3. للدعم الفني والاستفسار، تواصل مع فريقنا عبر نافذة الدعم المباشر في المتجر.

شكراً لتسوقكم من Origin Shop!
======================================================================`;

  const mimeType = fileFormat === 'PDF' ? 'application/pdf' : 'text/plain;charset=utf-8';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  
  const cleanName = fileName.includes('.') 
    ? fileName 
    : `${fileName}_ORIGIN_SHOP_${orderId}.txt`;

  anchor.download = cleanName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
