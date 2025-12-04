import { Container, Text } from "@react-three/uikit";
import { colors, Button } from "@react-three/uikit-default";
import { useState, useRef } from "react";
import { DialogDemo } from "./DialogDemo";
import { useSwipeGesture, useThumbGesture } from "@repo/nav/hooks";

const SCROLL_AMOUNT = 200;

function PageOne({
  setCurrentPage,
  scrollContainerRef,
}: {
  setCurrentPage: (page: number) => void;
  scrollContainerRef: React.RefObject<any>;
}) {
  return (
    <Container
      flexDirection="column"
      gapRow={10}
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
    >
      <Text color={colors.primary}>Page One</Text>
      <Container
        ref={scrollContainerRef}
        sizeY={2.5}
        overflow="scroll"
        borderWidth={2}
        borderColor="gray"
        borderRadius={8}
        backgroundColor={colors.background}
        padding={10}
        flexDirection="column"
        gapRow={10}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <Container
            key={i}
            sizeX={1}
            sizeY={0.3}
            backgroundColor={colors.primary}
            borderRadius={5}
            alignItems="center"
            justifyContent="center"
          >
            <Text color={colors.primaryForeground}>Test stuff</Text>
          </Container>
        ))}
        <Button
          onClick={() => {
            setCurrentPage(2);
          }}
        >
          <Text>Next</Text>
        </Button>
      </Container>
    </Container>
  );
}

function PageTwo() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Container
      flexDirection="column"
      gapRow={10}
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
      width="100%"
    >
      <Text color={colors.primary}>Page Two</Text>
      <DialogDemo dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />{" "}
      <Button
        onClick={() => {
          console.log("dialog open");
          setDialogOpen(true);
        }}
      >
        <Text>Open Dialog</Text>
      </Button>
    </Container>
  );
}

export function PageContainer() {
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<any>(null);

  const handleScrollUp = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPosition = container.scrollPosition?.value;
      const maxScrollPosition = container.maxScrollPosition?.value;

      if (scrollPosition && Array.isArray(scrollPosition)) {
        console.log("scrollPosition", scrollPosition);
        // scrollPosition is [x, y], swipe up means scroll content up (increase y)
        const currentY = scrollPosition[1] || 0;
        const maxY = maxScrollPosition?.[1] || 0;
        const newY = Math.min(maxY, currentY + SCROLL_AMOUNT);
        // Update the scroll position by reassigning the array
        container.scrollPosition.value = [scrollPosition[0] || 0, newY];
      }
    }
  };

  const handleScrollDown = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPosition = container.scrollPosition?.value;
      const maxScrollPosition = container.maxScrollPosition?.value;

      if (scrollPosition && Array.isArray(scrollPosition)) {
        console.log("scrollPosition", scrollPosition);
        // scrollPosition is [x, y], swipe down means scroll content down (decrease y)
        const currentY = scrollPosition[1] || 0;
        const maxY = maxScrollPosition?.[1] || 0;
        const newY = Math.max(0, currentY - SCROLL_AMOUNT);
        // Update the scroll position by reassigning the array
        container.scrollPosition.value = [scrollPosition[0] || 0, newY];
      }
    }
  };

  useSwipeGesture({
    onLeft: () => setCurrentPage(2),
    onRight: () => setCurrentPage(1),
    onUp: () => handleScrollUp(),
    onDown: () => handleScrollDown(),
  });

  useThumbGesture({
    onThumbsUp: () => {
      console.log("thumbs up");
    },
    onThumbsDown: () => {
      console.log("thumbs down");
    },
  });

  return (
    <group position={[0, 0, 10]} rotation={[0, Math.PI, 0]}>
      <Container
        backgroundColor={colors.background}
        sizeX={8}
        sizeY={4}
        flexDirection="column"
        borderWidth={5}
        borderColor="black"
        gapRow={30}
        borderRadius={10}
        alignItems="center"
        justifyContent="center"
        padding={10}
      >
        {currentPage === 1 ? (
          <PageOne
            setCurrentPage={setCurrentPage}
            scrollContainerRef={scrollContainerRef}
          />
        ) : (
          <PageTwo />
        )}
        <Container flexDirection="row" gap={10}>
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            backgroundColor={colors.primary}
          >
            <Text color={colors.primaryForeground}>Previous Page</Text>
          </Button>
          <Button
            disabled={currentPage === 2}
            onClick={() => setCurrentPage(2)}
            backgroundColor={colors.primary}
          >
            <Text color={colors.primaryForeground}>Next Page</Text>
          </Button>
        </Container>
      </Container>
    </group>
  );
}
