import Script from 'next/script';

export const DemoVideoModal = () => {
  return (
    <>
      {/* Video modal */}
      <div
        id="demo-modal"
        className="fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4 backdrop-blur-sm md:p-8"
      >
        <div className="relative w-full max-w-4xl">
          <button
            id="demo-modal-close"
            type="button"
            aria-label="Close video"
            className="absolute -top-10 right-0 cursor-pointer text-sm font-medium text-white/80 hover:text-white"
          >
            Close &times;
          </button>
          <div
            id="demo-modal-video"
            className="aspect-video w-full overflow-hidden rounded-2xl bg-black"
          />
        </div>
      </div>

      <Script id="demo-video-init" strategy="afterInteractive">{`
        (function() {
          var btn = document.getElementById('demo-btn');
          var modal = document.getElementById('demo-modal');
          var closeBtn = document.getElementById('demo-modal-close');
          var videoContainer = document.getElementById('demo-modal-video');
          if (!btn || !modal) return;

          btn.addEventListener('click', function() {
            while (videoContainer.firstChild) videoContainer.removeChild(videoContainer.firstChild);
            var iframe = document.createElement('iframe');
            iframe.src = 'https://player.vimeo.com/video/1170655450?badge=0&autopause=0&autoplay=1&player_id=0&app_id=58479';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media');
            iframe.setAttribute('title', 'AllSearch Demo');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            videoContainer.style.position = 'relative';
            videoContainer.appendChild(iframe);
            modal.classList.remove('hidden');
            modal.classList.add('flex');
          });

          function closeModal() {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            while (videoContainer.firstChild) videoContainer.removeChild(videoContainer.firstChild);
          }

          closeBtn.addEventListener('click', closeModal);
          modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
          });
        })();
      `}</Script>
    </>
  );
};
