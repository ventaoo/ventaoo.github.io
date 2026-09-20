/** 文章页顶部那根细进度条 —— 唯一的滚动相关动效。 */
export function bindProgress(root: ParentNode): () => void {
  const bar = root.querySelector<HTMLElement>('.progress');
  if (!bar) return () => {};

  const update = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const ratio = total > 40 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    bar.style.width = (ratio * 100).toFixed(2) + '%';
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  return () => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  };
}
