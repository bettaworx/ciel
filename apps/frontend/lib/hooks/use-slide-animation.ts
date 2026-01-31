import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

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

  const resolveEase = (value: string) => {
    if (value === 'power2.inOut') {
      return (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    }

    if (value === 'linear') {
      return 'linear' as const;
    }

    return 'easeInOut' as const;
  };

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

    const resolvedEase = resolveEase(ease);

    const applyStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
      Object.assign(element.style, styles);
    };

    const resetWillChange = () => {
      currentElement.style.willChange = 'auto';
      previousElement.style.willChange = 'auto';
    };

    currentElement.style.willChange = 'transform, opacity';
    previousElement.style.willChange = 'transform, opacity';

    // 現在の要素の高さを取得するために一時的に表示
    applyStyles(currentElement, {
      display: 'block',
      position: 'absolute',
      visibility: 'hidden',
      opacity: '1',
      transform: 'translateX(0%)',
    });

    const targetHeight = currentElement.offsetHeight;
    currentElement.style.visibility = 'visible';

    const currentHeight = container.offsetHeight;
    container.style.height = `${currentHeight}px`;

    const activeAnimations = [
      animate(container, { height: targetHeight }, { duration, ease: resolvedEase }),
    ];

    if (isGoingToSub) {
      // メイン → サブ画面
      applyStyles(currentElement, {
        transform: 'translateX(100%)',
        opacity: '1',
        display: 'block',
        position: 'absolute',
      });

      activeAnimations.push(
        animate(previousElement, { x: '-100%', opacity: 0 }, { duration, ease: resolvedEase }),
        animate(currentElement, { x: '0%', opacity: 1 }, { duration, ease: resolvedEase }),
      );
    } else if (isGoingToMain) {
      // サブ画面 → メイン
      applyStyles(currentElement, {
        transform: 'translateX(-100%)',
        opacity: '1',
        display: 'block',
        position: 'relative',
      });

      activeAnimations.push(
        animate(previousElement, { x: '100%', opacity: 0 }, { duration, ease: resolvedEase }),
        animate(currentElement, { x: '0%', opacity: 1 }, { duration, ease: resolvedEase }),
      );
    } else {
      // サブ画面間の切り替え（theme ⇔ language）
      applyStyles(currentElement, {
        transform: 'translateX(100%)',
        opacity: '1',
        display: 'block',
        position: 'absolute',
      });

      activeAnimations.push(
        animate(previousElement, { x: '-100%', opacity: 0 }, { duration, ease: resolvedEase }),
        animate(currentElement, { x: '0%', opacity: 1 }, { duration, ease: resolvedEase }),
      );
    }

    let isActive = true;
    Promise.all(activeAnimations.map((animation) => animation.finished))
      .then(() => {
        if (!isActive) return;
        previousElement.style.display = 'none';
        if (isGoingToMain) {
          container.style.height = 'auto';
        } else {
          container.style.height = `${targetHeight}px`;
        }
        resetWillChange();
      })
      .catch(() => {
        if (!isActive) return;
        resetWillChange();
      });

    // 前回のビューを更新
    previousViewRef.current = currentView;

    return () => {
      isActive = false;
      activeAnimations.forEach((animation) => animation.stop());
    };
  }, [currentView, containerRef, duration, ease]);

  return null;
}
