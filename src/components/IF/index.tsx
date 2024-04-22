import * as React from "react";

interface IFProps {
  className?: string;
  condition: boolean;
  forceRender?: boolean;
  children: React.ReactNode;
}

const IF: React.FC<IFProps> = (props) => {
  const { className, condition, forceRender, children } = props;

  if (forceRender) {
    return condition ? <>{children}</> : null;
  }

  return (
    <div className={className} style={{ display: condition ? "block" : "none" }}>
      {children}
    </div>
  );
};

export default React.memo(IF);
