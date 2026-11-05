import { describe, expect, it } from 'vitest';
import { youtubeEmbedUrl, youtubeId } from '@/lib/youtube';

describe('video di YouTube senza cookie', () => {
  it('legge l’id da watch, shorts, youtu.be ed embed', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=aS7CmLiC0nQ')).toBe('aS7CmLiC0nQ');
    expect(youtubeId('https://youtube.com/shorts/IPbeSEfeE2c')).toBe('IPbeSEfeE2c');
    expect(youtubeId('https://youtu.be/LqRXesBqaZc')).toBe('LqRXesBqaZc');
    expect(youtubeId('https://www.youtube.com/embed/c42oiIHdrwc')).toBe('c42oiIHdrwc');
    expect(youtubeId('https://example.com/video.mp4')).toBeNull();
    expect(youtubeId(null)).toBeNull();
  });
  it('l’embed passa sempre da youtube-nocookie.com', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=aS7CmLiC0nQ')).toBe('https://www.youtube-nocookie.com/embed/aS7CmLiC0nQ');
    expect(youtubeEmbedUrl(undefined)).toBeNull();
  });
});
