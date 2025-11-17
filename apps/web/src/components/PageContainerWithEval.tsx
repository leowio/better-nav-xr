import { Container, Text } from "@react-three/uikit";
import { colors, Button } from "@react-three/uikit-default";
import { useState, useRef, useEffect } from "react";
import { DialogDemo } from "./DialogDemo";
import { useSwipeGesture } from "@repo/nav/hooks";

function PageOne({ setCurrentPage }: { setCurrentPage: () => void }) {
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
        <Button onClick={setCurrentPage}>
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

type EvaluableItem = {
  id: string;
  name: string;
  action: () => void;
};

export function PageContainerWithEval() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeEvaluation, setActiveEvaluation] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Wait for command");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const nextEvaluationTimeoutRef = useRef<number | null>(null);
  const currentEvaluationIndexRef = useRef(0);
  const evaluableItemsRef = useRef<EvaluableItem[]>([]);

  const startEvaluation = (itemId: string, itemName: string) => {
    setActiveEvaluation(itemId);
    setStatusText(`Evaluating: ${itemName}...`);
    setExecutionTime(null);
    timerStartRef.current = performance.now();
  };

  const stopEvaluation = (itemId: string) => {
    if (timerStartRef.current !== null) {
      const elapsed = performance.now() - timerStartRef.current;
      setExecutionTime(elapsed);
      timerStartRef.current = null;
      setStatusText("Wait for command");
      console.log(`${itemId} completed in ${elapsed.toFixed(2)}ms`);
      setActiveEvaluation(null);

      // Schedule next evaluation after 2 seconds
      if (nextEvaluationTimeoutRef.current !== null) {
        clearTimeout(nextEvaluationTimeoutRef.current);
      }
      nextEvaluationTimeoutRef.current = window.setTimeout(() => {
        const evaluableItems = evaluableItemsRef.current;
        const nextIndex =
          (currentEvaluationIndexRef.current + 1) % evaluableItems.length;
        currentEvaluationIndexRef.current = nextIndex;
        const nextItem = evaluableItems[nextIndex];
        startEvaluation(nextItem.id, nextItem.name);
      }, 2000);
    }
  };

  const handleNextPage = () => {
    if (activeEvaluation === "next-page") {
      stopEvaluation("next-page");
    }
    setCurrentPage(2);
  };

  const handlePreviousPage = () => {
    if (activeEvaluation === "previous-page") {
      stopEvaluation("previous-page");
    }
    setCurrentPage(1);
  };

  const evaluableItems: EvaluableItem[] = [
    {
      id: "next-page",
      name: "Next Page Button",
      action: () => {
        startEvaluation("next-page", "Next Page Button");
      },
    },
    {
      id: "previous-page",
      name: "Previous Page Button",
      action: () => {
        startEvaluation("previous-page", "Previous Page Button");
      },
    },
  ];

  // Update ref with current evaluableItems
  evaluableItemsRef.current = evaluableItems;

  // Start the first evaluation automatically on mount
  useEffect(() => {
    const firstItem = evaluableItems[0];
    const timeoutId = setTimeout(() => {
      startEvaluation(firstItem.id, firstItem.name);
    }, 5000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nextEvaluationTimeoutRef.current !== null) {
        clearTimeout(nextEvaluationTimeoutRef.current);
      }
    };
  }, []);

  useSwipeGesture({
    onLeft: () => handleNextPage(),
    onRight: () => handlePreviousPage(),
    onUp: () => console.log("up swipe detected"),
    onDown: () => console.log("down swipe detected"),
  });

  return (
    <group position={[0, 0, 10]} rotation={[0, Math.PI, 0]}>
      <Container
        backgroundColor={colors.background}
        sizeX={8}
        sizeY={6}
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
          <PageOne setCurrentPage={handleNextPage} />
        ) : (
          <PageTwo />
        )}
        <Container flexDirection="row" gap={10}>
          <Button
            disabled={currentPage === 1}
            onClick={handlePreviousPage}
            backgroundColor={colors.primary}
          >
            <Text color={colors.primaryForeground}>Previous Page</Text>
          </Button>
          <Button
            disabled={currentPage === 2}
            onClick={handleNextPage}
            backgroundColor={colors.primary}
          >
            <Text color={colors.primaryForeground}>Next Page</Text>
          </Button>
        </Container>
        <Container
          sizeX={6}
          sizeY={0.5}
          backgroundColor={colors.primary}
          borderRadius={20}
          alignItems="center"
          justifyContent="center"
        >
          <Text color={colors.primaryForeground}>{statusText}</Text>
        </Container>
      </Container>
    </group>
  );
}
