import Script from 'next/script';

export const HeroVideoInit = () => {
  return (
    <>
      <Script id="hero-video-init" strategy="afterInteractive">{`
        (function() {
          var btn = document.getElementById('hero-play-btn');
          if (!btn) return;
          btn.addEventListener('click', function() {
            var mockup = document.getElementById('hero-mockup');
            var container = document.getElementById('hero-video');
            var wrapper = mockup.closest('[class*="max-h-"]');
            var outer = wrapper && wrapper.parentElement && wrapper.parentElement.parentElement;
            if (wrapper) { wrapper.style.maxHeight = 'none'; }
            if (outer) { outer.style.height = 'auto'; }
            container.style.aspectRatio = '1.84'; // almost 16:9
            container.style.width = '100%';
            var iframe = document.createElement('iframe');
            iframe.src = 'https://player.vimeo.com/video/1170655450?badge=0&autopause=0&autoplay=1&player_id=0&app_id=58479';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            iframe.setAttribute('title', 'AllSearch Demo March 2026');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            container.appendChild(iframe);
            mockup.classList.add('hidden');
            container.classList.remove('hidden');
            btn.classList.add('hidden');
          });
        })();
      `}</Script>
      <Script src="https://player.vimeo.com/api/player.js" strategy="afterInteractive" />
    </>
  );
};
