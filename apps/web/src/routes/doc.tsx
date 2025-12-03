import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/doc")({
  component: Documentation,
});

function Documentation() {
  const gestures = [
    {
      title: "Go Forward",
      description: "Wave your hand to the left to navigate forward.",
      image: "/instruction/instruction-forward.jpeg",
    },
    {
      title: "Go Back",
      description: "Wave your hand to the right to navigate back.",
      image: "/instruction/instruction-back.jpeg",
    },
    {
      title: "Scroll Up",
      description: "Wave your hand down to scroll up the page.",
      image: "/instruction/instruction-scroll-up.jpeg",
    },
    {
      title: "Scroll Down",
      description: "Wave your hand up to scroll down the page.",
      image: "/instruction/instruction-scroll-down.jpeg",
    },
    {
      title: "Accept",
      description: "Thumbs-up gesture to accept.",
      image: "/instruction/instruction-accept.jpeg",
    },
    {
      title: "Decline",
      description: "Thumbs-down gesture to decline.",
      image: "/instruction/instruction-decline.jpeg",
    },
  ];

  return (
    <>
      <h2>Gesture Guide</h2>
      <p>Pinch your index finger and thumb together to start a wave gesture.</p>
      {gestures.map((gesture) => (
        <div key={gesture.title} className="flex flex-col items-center">
          <img
            src={gesture.image}
            alt={gesture.title}
            className="object-cover w-[256px] h-[256px]"
          />
          <h3 className="text-xl font-semibold mb-2">{gesture.title}</h3>
          <p className="text-center text-sm">{gesture.description}</p>
        </div>
      ))}
    </>
  );
}
