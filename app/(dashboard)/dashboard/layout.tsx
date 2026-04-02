import React, { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		<div className="flex w-full h-screen">
      <div className="flex h-full w-full flex-col items-center bg-secondary py-3 px-2 border-r border-border">
        {children}
      </div>
		</div>
	);
};

export default DashboardLayout;
