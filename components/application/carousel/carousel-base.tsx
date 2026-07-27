'use client';

import type {
  CSSProperties,
  ComponentPropsWithRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  Ref,
} from 'react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cx } from '@/utils/cx';

type CarouselOptions = {
  /** Alignment of slides within the viewport. */
  align?: 'start' | 'center' | 'end';
  /** Enable/disable looping. */
  loop?: boolean;
};

type CarouselProps = {
  /** The options for the carousel. */
  opts?: CarouselOptions;
  /** The orientation of the carousel. */
  orientation?: 'horizontal' | 'vertical';
};

type CarouselContextProps = CarouselProps & {
  /** The ref of the carousel container. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The function to scroll the carousel to the previous slide. */
  scrollPrev: () => void;
  /** The function to scroll the carousel to the next slide. */
  scrollNext: () => void;
  /** The function to scroll to a specific slide. */
  scrollTo: (index: number) => void;
  /** Whether the carousel can scroll to the previous slide. */
  canScrollPrev: boolean;
  /** Whether the carousel can scroll to the next slide. */
  canScrollNext: boolean;
  /** The index of the selected slide. */
  selectedIndex: number;
  /** The total number of slides. */
  slideCount: number;
  /** Register a slide and return its index. */
  registerSlide: () => number;
};

export const CarouselContext = createContext<CarouselContextProps | null>(null);

export const useCarousel = () => {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error('The `useCarousel` hook must be used within a <Carousel />');
  }

  return context;
};

const CarouselRoot = ({
  orientation = 'horizontal',
  opts,
  className,
  children,
  ...props
}: ComponentPropsWithRef<'div'> & CarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slideCountRef = useRef(0);
  const [slideCount, setSlideCount] = useState(0);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const isHorizontal = orientation === 'horizontal';
    const scrollPos = isHorizontal ? container.scrollLeft : container.scrollTop;
    const scrollSize = isHorizontal ? container.scrollWidth : container.scrollHeight;
    const clientSize = isHorizontal ? container.clientWidth : container.clientHeight;

    setCanScrollPrev(scrollPos > 1);
    setCanScrollNext(scrollPos < scrollSize - clientSize - 1);

    // Calculate selected index based on scroll position
    const slides = container.children;
    if (slides.length === 0) return;

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i] as HTMLElement;
      const slideStart = isHorizontal ? slide.offsetLeft : slide.offsetTop;
      const distance = Math.abs(scrollPos - slideStart);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    setSelectedIndex(closestIndex);
  }, [orientation]);

  const scrollPrev = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const slides = container.children;
    const targetIndex = Math.max(0, selectedIndex - 1);
    const targetSlide = slides[targetIndex] as HTMLElement;

    if (targetSlide) {
      targetSlide.scrollIntoView({
        behavior: 'smooth',
        block: orientation === 'vertical' ? 'start' : 'nearest',
        inline: orientation === 'horizontal' ? 'start' : 'nearest',
      });
    }
  }, [selectedIndex, orientation]);

  const scrollNext = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const slides = container.children;
    const targetIndex = Math.min(slides.length - 1, selectedIndex + 1);
    const targetSlide = slides[targetIndex] as HTMLElement;

    if (targetSlide) {
      targetSlide.scrollIntoView({
        behavior: 'smooth',
        block: orientation === 'vertical' ? 'start' : 'nearest',
        inline: orientation === 'horizontal' ? 'start' : 'nearest',
      });
    }
  }, [selectedIndex, orientation]);

  const scrollTo = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;

      const slides = container.children;
      const targetSlide = slides[index] as HTMLElement;

      if (targetSlide) {
        targetSlide.scrollIntoView({
          behavior: 'smooth',
          block: orientation === 'vertical' ? 'start' : 'nearest',
          inline: orientation === 'horizontal' ? 'start' : 'nearest',
        });
      }
    },
    [orientation]
  );

  const registerSlide = useCallback(() => {
    const index = slideCountRef.current;
    slideCountRef.current += 1;
    return index;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  // Reset slide count on each render cycle
  useEffect(() => {
    slideCountRef.current = 0;
  });

  // Update slide count after children render
  useEffect(() => {
    setSlideCount(slideCountRef.current);
  }, [children]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollState();

    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  return (
    <CarouselContext.Provider
      value={{
        containerRef,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        slideCount,
        registerSlide,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cx('relative', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
};

interface CarouselContentProps extends ComponentPropsWithRef<'div'> {
  /** The class name of the content. */
  className?: string;
  /** Whether to hide the overflow. */
  overflowHidden?: boolean;
}

const CarouselContent = ({ className, overflowHidden = true, ...props }: CarouselContentProps) => {
  const { containerRef, orientation, opts } = useCarousel();

  const alignClass =
    opts?.align === 'center' ? 'snap-center' : opts?.align === 'end' ? 'snap-end' : 'snap-start';

  return (
    <div
      ref={containerRef}
      className={cx(
        'flex h-full w-full snap-x snap-mandatory scroll-smooth',
        orientation === 'vertical' && 'snap-y flex-col',
        overflowHidden ? 'overflow-hidden' : 'overflow-auto',
        // Hide scrollbar
        'scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      style={
        {
          '--carousel-snap-align':
            alignClass === 'snap-start' ? 'start' : alignClass === 'snap-center' ? 'center' : 'end',
        } as CSSProperties
      }
      {...props}
    />
  );
};

const CarouselItem = ({ className, ...props }: ComponentPropsWithRef<'div'>) => {
  const { opts } = useCarousel();

  const snapAlign =
    opts?.align === 'center' ? 'snap-center' : opts?.align === 'end' ? 'snap-end' : 'snap-start';

  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cx('min-w-0 shrink-0 grow-0 basis-full', snapAlign, className)}
      {...props}
    />
  );
};

interface TriggerRenderProps {
  isDisabled: boolean;
  onClick: () => void;
}

interface TriggerProps {
  /** The ref of the trigger. */
  ref?: Ref<HTMLButtonElement>;
  /** If true, the child element will be cloned and passed down the prop of the trigger. */
  asChild?: boolean;
  /** The direction of the trigger. */
  direction: 'prev' | 'next';
  /** The children of the trigger. Can be a render prop or a valid element. */
  children: ReactNode | ((props: TriggerRenderProps) => ReactNode);
  /** The style of the trigger. */
  style?: CSSProperties;
  /** The class name of the trigger. */
  className?: string | ((args: { isDisabled: boolean }) => string);
}

const Trigger = ({ className, children, asChild, direction, style, ...props }: TriggerProps) => {
  const { scrollPrev, canScrollNext, scrollNext, canScrollPrev } = useCarousel();

  const isDisabled = direction === 'prev' ? !canScrollPrev : !canScrollNext;

  const handleClick = () => {
    if (isDisabled) return;

    if (direction === 'prev') {
      scrollPrev();
    } else {
      scrollNext();
    }
  };

  const computedClassName = typeof className === 'function' ? className({ isDisabled }) : className;

  const defaultAriaLabel = direction === 'prev' ? 'Previous slide' : 'Next slide';

  // If the children is a render prop, we need to pass the necessary props to the render prop.
  if (typeof children === 'function') {
    return <>{children({ isDisabled, onClick: handleClick })}</>;
  }

  // If the children is a valid element, we need to clone it and pass the necessary props to the cloned element.
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      onClick: handleClick,
      disabled: isDisabled,
      'aria-label': defaultAriaLabel,
      style: { ...(children.props as HTMLAttributes<HTMLElement>).style, ...style },
      className:
        [computedClassName, (children.props as HTMLAttributes<HTMLElement>).className]
          .filter(Boolean)
          .join(' ') || undefined,
    } as HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      aria-label={defaultAriaLabel}
      disabled={isDisabled}
      className={computedClassName}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

const CarouselPrevTrigger = (props: Omit<TriggerProps, 'direction'>) => (
  <Trigger {...props} direction="prev" />
);

const CarouselNextTrigger = (props: Omit<TriggerProps, 'direction'>) => (
  <Trigger {...props} direction="next" />
);

interface CarouselIndicatorRenderProps {
  isSelected: boolean;
  onClick: () => void;
}

interface CarouselIndicatorProps {
  /** The index of the indicator. */
  index: number;
  /** If true, the child element will be cloned and passed down the prop of the indicator. */
  asChild?: boolean;
  /** If true, the indicator will be selected. */
  isSelected?: boolean;
  /** The children of the indicator. Can be a render prop or a valid element. */
  children?: ReactNode | ((props: CarouselIndicatorRenderProps) => ReactNode);
  /** The style of the indicator. */
  style?: CSSProperties;
  /** The class name of the indicator. */
  className?: string | ((args: { isSelected: boolean }) => string);
}

const CarouselIndicator = ({
  index,
  isSelected: isSelectedProp = false,
  children,
  asChild,
  className,
  style,
}: CarouselIndicatorProps) => {
  const { scrollTo, selectedIndex } = useCarousel();

  const isSelected = isSelectedProp || selectedIndex === index;

  const handleClick = () => {
    scrollTo(index);
  };
  const computedClassName = typeof className === 'function' ? className({ isSelected }) : className;

  const defaultAriaLabel = 'Go to slide' + (index + 1);

  // If the children is a render prop, we need to pass the necessary props to the render prop.
  if (typeof children === 'function') {
    return <>{children({ isSelected, onClick: handleClick })}</>;
  }

  // If the children is a valid element, we need to clone it and pass the necessary props to the cloned element.
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      onClick: handleClick,
      'aria-label': defaultAriaLabel,
      'aria-current': isSelected ? 'true' : undefined,
      style: { ...(children.props as HTMLAttributes<HTMLElement>).style, ...style },
      className:
        [computedClassName, (children.props as HTMLAttributes<HTMLElement>).className]
          .filter(Boolean)
          .join(' ') || undefined,
    } as HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      aria-label={defaultAriaLabel}
      aria-current={isSelected ? 'true' : undefined}
      className={computedClassName}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

interface CarouselIndicatorGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode | ((props: { index: number }) => ReactNode);
  className?: string;
}

const CarouselIndicatorGroup = ({ children, ...props }: CarouselIndicatorGroupProps) => {
  const { slideCount } = useCarousel();

  // If the children is a render prop, we need to pass the index to the render prop.
  if (typeof children === 'function') {
    return (
      <nav {...props}>{Array.from({ length: slideCount }, (_, index) => children({ index }))}</nav>
    );
  }

  return <nav {...props}>{children}</nav>;
};

export const Carousel = {
  Root: CarouselRoot,
  Content: CarouselContent,
  Item: CarouselItem,
  PrevTrigger: CarouselPrevTrigger,
  NextTrigger: CarouselNextTrigger,
  IndicatorGroup: CarouselIndicatorGroup,
  Indicator: CarouselIndicator,
};
