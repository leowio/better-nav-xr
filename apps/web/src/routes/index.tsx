import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Text, Container } from "@react-three/uikit";
import { colors, Button } from "@react-three/uikit-default";
import { createXRStore, PointerEvents, XR } from "@react-three/xr";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DialogDemo } from "~/components/DialogDemo";
import Scene from "~/components/scene";
import { XRJointsProvider } from "@repo/nav/components";

export const Route = createFileRoute("/")({
  component: Index,
});

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

function Index() {
  const store = useMemo(
    () =>
      createXRStore({
        hand: { left: true, right: true },
        offerSession: "immersive-vr",
        emulate: {
          inject: false,
        },
      }),
    []
  );

  const [currentPage, setCurrentPage] = useState(1);

  return (
    <main className="relative h-[800px] w-[800px] grow-0 rounded-lg bg-linear-to-b from-[#2e026d] to-[#15162c] overflow-hidden">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 10, -40], fov: 25 }}>
        <OrbitControls />
        <PointerEvents />
        <XR store={store}>
          <XRJointsProvider>
            <Scene />
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
          </XRJointsProvider>
        </XR>
      </Canvas>
      <button
        type="button"
        className="absolute right-4 bottom-4 rounded-full bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
        onClick={() => {
          store.enterVR();
        }}
      >
        Enter VR
      </button>
    </main>
  );
}
