import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      // বাটন, লিংক বা ক্লিকযোগ্য এলিমেন্টে হোভার করলে কার্সার বড় হবে
      if (
        e.target.tagName === "BUTTON" ||
        e.target.tagName === "A" ||
        e.target.closest("button") ||
        e.target.closest(".clickable")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isVisible]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
      <AnimatePresence>
        {isVisible && (
          <>
            {/* বাইরের রিং - যা একটু দেরিতে মাউসকে ফলো করবে (Spring effect) */}
            <motion.div
              className="absolute w-10 h-10 border border-cyan-500/50 rounded-full"
              animate={{
                x: mousePos.x - 20,
                y: mousePos.y - 20,
                scale: isHovering ? 1.5 : 1,
                borderColor: isHovering ? "#a855f7" : "#22d3ee",
                backgroundColor: isHovering ? "rgba(168, 85, 247, 0.1)" : "transparent",
              }}
              transition={{ type: "spring", damping: 20, stiffness: 250, mass: 0.5 }}
            />

            {/* ভেতরের ডট - যা মাউসের সাথে সাথে থাকবে */}
            <motion.div
              className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(34,211,238,1)]"
              animate={{
                x: mousePos.x - 4,
                y: mousePos.y - 4,
                scale: isHovering ? 0.5 : 1,
              }}
              transition={{ type: "spring", damping: 30, stiffness: 800 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCursor;