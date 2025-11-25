import { motion } from "framer-motion";

const backgroundBlur = () => {
	return (
		<>
			<motion.div
				animate={{
					scale: [1, 1.5, 1],
					opacity: [0.4, 0.9, 0.4],
					transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
				}}
				className="bg-primary/60 absolute top-1/8 -right-20 z-[-1] h-72 w-72 rounded-full opacity-80 blur-3xl"
			></motion.div>
			<motion.div
				animate={{
					scale: [1, 1.5, 1],
					opacity: [0.4, 0.9, 0.4],
					transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
				}}
				className="bg-primary/60 absolute top-1/2 -left-20 z-[-1] h-64 w-64 rounded-full opacity-80 blur-3xl"
			></motion.div>
		</>
	);
};

export default backgroundBlur;
