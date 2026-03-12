// src/modules/media/youtube.service.ts

export class YouTubeService {
  /**
   * دالة لاستخراج ID الفيديو أو القائمة من أي لينك يوتيوب
   * وتحويله لـ Embed URL جاهز للفرونت إند
   */
  static getSecureEmbedUrl(youtubeUrlOrId: string, isPlaylist: boolean = false): string {
    let id = youtubeUrlOrId;

    // لو المبعوت لينك كامل، هنستخرج منه الـ ID
    if (youtubeUrlOrId.includes("youtube.com") || youtubeUrlOrId.includes("youtu.be")) {
      if (isPlaylist) {
        // استخراج ID القائمة (يبدأ بـ PL)
        const listMatch = youtubeUrlOrId.match(/[?&]list=([^#\&\?]+)/);
        id = listMatch ? listMatch[1] : youtubeUrlOrId;
      } else {
        // استخراج ID الفيديو العادي
        const videoMatch = youtubeUrlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#\&\?]*).*/);
        id = videoMatch ? videoMatch[1] : youtubeUrlOrId;
      }
    }

    // بناء رابط الـ Embed مع إخفاء تحكمات يوتيوب قدر الإمكان
    // rel=0: عدم عرض فيديوهات قنوات أخرى في النهاية
    // modestbranding=1: إخفاء لوجو يوتيوب
    // disablekb=1: تعطيل اختصارات الكيبورد عشان ميفتحش الفيديو على يوتيوب
    if (isPlaylist) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&rel=0&modestbranding=1&disablekb=1`;
    } else {
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&disablekb=1`;
    }
  }
}