export function MainContainer({ children }: { children: React.ReactNode }) {
  // Padding lives on the inner <div>, not on <main>. <main> is the scroll
  // container; sticky-positioned descendants resolve `top: 0` against the
  // inside of the scroll container's padding edge, so any padding here
  // would push their stuck position down by that amount. Keeping <main>
  // padding-free lets sticky elements (e.g. the article editor toolbar)
  // stick flush with the viewport top.
  return (
    <main className="flex h-dvh flex-col overflow-x-hidden overflow-y-scroll lg:ml-72">
      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-6">
        {children}
      </div>
    </main>
  );
}
