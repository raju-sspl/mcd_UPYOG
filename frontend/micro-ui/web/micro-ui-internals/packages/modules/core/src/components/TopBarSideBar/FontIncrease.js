import { Dropdown } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useEffect, useState } from "react";

const FontIncrease = () => {
    const defaultSize = 16;
    const [fontSize, setFontSize] = useState(defaultSize);
    const [selectedOption, setSelectedOption] = useState("none"); // prevent dropdown closing

    useEffect(() => {
        const savedSize = localStorage.getItem("fontSize");
        if (savedSize) {
            setFontSize(parseInt(savedSize));
            document.documentElement.style.fontSize = savedSize + "px";
        }
    }, []);

    const applyFontSize = (size) => {
        document.documentElement.style.fontSize = size + "px";
        localStorage.setItem("fontSize", size);
    };

    const increaseFont = () => {
        const maxSize = 22;
        if (fontSize >= maxSize) return;
        const newSize = fontSize + 2;
        setFontSize(newSize);
        applyFontSize(newSize);
    };

    const decreaseFont = () => {
        const minSize = 10;
        if (fontSize <= minSize) return;
        const newSize = fontSize - 2;
        setFontSize(newSize);
        applyFontSize(newSize);
    };

    const resetFont = () => {
        setFontSize(defaultSize);
        applyFontSize(defaultSize);
    };

    return (
        <div className="flex items-center">
            <Dropdown
                option={[
                    { label: "A+", value: "increase" },
                    { label: "A", value: "reset" },
                    { label: "A-", value: "decrease" },
                ]}
                optionKey="label"
                freeze={true}
                keepSelectedState={true}   // 🔥 IMPORTANT: prevents dropdown closing
                selected={{ label: "", value: selectedOption }}
                select={(item) => {
                    // Run your actions
                    if (item.value === "increase") increaseFont();
                    if (item.value === "reset") resetFont();
                    if (item.value === "decrease") decreaseFont();

                    // Keep same selected value → dropdown stays OPEN
                    setSelectedOption("none");
                }}
                customSelector={
                    <img className="city" style={{ width: "35px", height: "35px" }} src="https://abdeas-dev-asset.s3.ap-south-1.amazonaws.com/accessibility.svg" alt="Font Size" />
                }
            />
        </div>
    );
};

export default FontIncrease;
