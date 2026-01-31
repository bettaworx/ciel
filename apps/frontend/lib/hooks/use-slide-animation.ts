import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type ViewType = 'main' | 'theme' | 'language';

interface UseSlideAnimationProps {
  currentView: ViewType;
  containerRef: React.RefObject<HTMLDivElement | null>;
  duration?: number;
  ease?: string;
}

export function useSlideAnimation({
  currentView,
  containerRef,
  duration = 0.3,
  ease = 'power2.inOut',
}: UseSlideAnimationProps) {
  const previousViewRef = useRef<ViewType>('main');

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const previousView = previousViewRef.current;

    // ビューが変わっていない場合は何もしない
    if (previousView === currentView) return;

    // アニメーション方向を決定
    const isGoingToSub = currentView !== 'main' && previousView === 'main';
    const isGoingToMain = currentView === 'main' && previousView !== 'main';

    // 全ビュー要素を取得
    const mainView = container.querySelector('[data-view="main"]') as HTMLElement;
    const themeView = container.querySelector('[data-view="theme"]') as HTMLElement;
    const languageView = container.querySelector('[data-view="language"]') as HTMLElement;

    const viewMap: Record<ViewType, HTMLElement | null> = {
      main: mainView,
      theme: themeView,
      language: languageView,
    };

    const currentElement = viewMap[currentView];
    const previousElement = viewMap[previousView];

    if (!currentElement || !previousElement) return;

    // GPU アクセラレーションを有効化
    gsap.set([currentElement, previousElement], { 
      force3D: true,
      willChange: 'transform, opacity'
    });

    // 現在の要素の高さを取得するために一時的に表示
    gsap.set(currentElement, { display: 'block', position: 'absolute', visibility: 'hidden', x: 0, opacity: 1 });
    const targetHeight = currentElement.offsetHeight;
    gsap.set(currentElement, { visibility: 'visible' });

    // アニメーション実行
    if (isGoingToSub) {
      // メイン → サブ画面
      gsap.timeline()
        .set(currentElement, { x: '100%', opacity: 1, display: 'block', position: 'absolute' })
        .to(container, { height: targetHeight, duration, ease }, 0)
        .to(previousElement, { x: '-100%', opacity: 0, duration, ease }, 0)
        .to(currentElement, { x: '0%', opacity: 1, duration, ease }, 0)
        .set(previousElement, { display: 'none' })
        .set([currentElement, previousElement], { willChange: 'auto' });
    } else if (isGoingToMain) {
      // サブ画面 → メイン
      gsap.timeline()
        .set(currentElement, { x: '-100%', opacity: 1, display: 'block', position: 'relative' })
        .to(container, { height: targetHeight, duration, ease }, 0)
        .to(previousElement, { x: '100%', opacity: 0, duration, ease }, 0)
        .to(currentElement, { x: '0%', opacity: 1, duration, ease }, 0)
        .set(previousElement, { display: 'none' })
        .set(container, { height: 'auto' })
        .set([currentElement, previousElement], { willChange: 'auto' });
    } else {
      // サブ画面間の切り替え（theme ⇔ language）
      gsap.timeline()
        .set(currentElement, { x: '100%', opacity: 1, display: 'block', position: 'absolute' })
        .to(container, { height: targetHeight, duration, ease }, 0)
        .to(previousElement, { x: '-100%', opacity: 0, duration, ease }, 0)
        .to(currentElement, { x: '0%', opacity: 1, duration, ease }, 0)
        .set(previousElement, { display: 'none' })
        .set([currentElement, previousElement], { willChange: 'auto' });
    }

    // 前回のビューを更新
    previousViewRef.current = currentView;
  }, [currentView, containerRef, duration, ease]);

  return null;
}
