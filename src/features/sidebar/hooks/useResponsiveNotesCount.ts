import { useState, useEffect, type RefObject } from "react";

/**
 * 사이드바 가용 공간에 따라 최근 노트 리스트 노출 개수를 동적으로 계산하는 Hook
 *
 * 실제 렌더링된 리스트 아이템의 높이를 측정하여
 * 컨테이너에 정확히 n개의 완전한 아이템만 표시합니다.
 * 화면 크기 변화 시 자동으로 개수를 조정합니다.
 */
export const useResponsiveNotesCount = (
  containerRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLUListElement | null>,
  minCount: number = 1,
  maxCount: number = 50,
) => {
  // 상수 정의
  const HEADER_HEIGHT = 20; // p 태그: text-[12px] + mb-2 + padding
  const ITEM_GAP = 2; // Tailwind gap-0.5 = 0.125rem = 2px
  const ESTIMATED_ITEM_HEIGHT = 32; // 아이템 예상 높이
  const DEBOUNCE_DELAY = 100; // ms

  const [notesCount, setNotesCount] = useState<number>(minCount);
  let resizeTimerId: ReturnType<typeof setTimeout>;

  useEffect(() => {
    const calculateNotesCount = () => {
      if (!containerRef.current || !listRef.current) {
        return;
      }

      const containerHeight = containerRef.current.clientHeight;
      const listElement = listRef.current;

      // 리스트의 직접 자식인 li 요소들 (skeleton 제외)
      const listItems = Array.from(listElement.children).filter(
        (child) => child.tagName === "LI",
      );

      if (listItems.length === 0) {
        // li 요소가 없을 때는 추정값으로 계산
        const availableHeight = containerHeight - HEADER_HEIGHT;
        const estimatedCount = Math.floor(
          availableHeight / ESTIMATED_ITEM_HEIGHT,
        );
        const count = Math.max(minCount, Math.min(estimatedCount, maxCount));
        setNotesCount(count);
        return;
      }

      // 첫 번째 아이템의 높이 측정 (margin, padding 포함)
      const firstItem = listItems[0] as HTMLElement;
      const itemStyles = window.getComputedStyle(firstItem);
      const itemHeight =
        firstItem.offsetHeight +
        parseFloat(itemStyles.marginTop) +
        parseFloat(itemStyles.marginBottom);

      // 리스트 영역의 실제 여유 높이
      const availableHeight = containerHeight - HEADER_HEIGHT;

      // 정확히 n개가 들어갈 수 있는 높이 계산
      let fittingCount = 0;

      if (availableHeight >= itemHeight) {
        fittingCount = 1;
        let remainingHeight = availableHeight - itemHeight;

        // 추가 아이템들은 gap 포함
        const itemHeightWithGap = itemHeight + ITEM_GAP;
        while (
          remainingHeight >= itemHeightWithGap &&
          fittingCount < maxCount
        ) {
          remainingHeight -= itemHeightWithGap;
          fittingCount++;
        }
      }

      // 최소/최대 개수 제한
      fittingCount = Math.max(minCount, Math.min(fittingCount, maxCount));
      setNotesCount(fittingCount);
    };

    // 디바운싱된 계산 함수
    const debouncedCalculate = () => {
      clearTimeout(resizeTimerId);
      resizeTimerId = setTimeout(calculateNotesCount, DEBOUNCE_DELAY);
    };

    // 약간의 지연을 두고 초기 계산
    const timeoutId = setTimeout(() => {
      calculateNotesCount();
    }, 50);

    // ResizeObserver로 컨테이너 크기 변화 감지 (디바운싱 적용)
    const observer = new ResizeObserver(() => {
      debouncedCalculate();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // MutationObserver로 리스트 자식 요소 변화 감지
    const mutationObserver = new MutationObserver(() => {
      debouncedCalculate();
    });

    if (listRef.current) {
      mutationObserver.observe(listRef.current, {
        childList: true,
        subtree: false,
      });
    }

    // 창 리사이즈 이벤트 (디바운싱 적용)
    window.addEventListener("resize", debouncedCalculate);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimerId);
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", debouncedCalculate);
    };
  }, [containerRef, listRef, minCount, maxCount]);

  return notesCount;
};
