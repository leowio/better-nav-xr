import { Container, Text } from "@react-three/uikit";
import { colors, Button } from "@react-three/uikit-default";
import { useState } from "react";
import { DialogDemo } from "./DialogDemo";
import { useSwipeGesture } from "@repo/nav/hooks";

function PageOne() {
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

  useSwipeGesture({
    onLeft: () => setCurrentPage(2),
    onRight: () => setCurrentPage(1),
    onUp: () => console.log("up swipe detected"),
    onDown: () => console.log("down swipe detected"),
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
        {currentPage === 1 ? <PageOne /> : <PageTwo />}
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
