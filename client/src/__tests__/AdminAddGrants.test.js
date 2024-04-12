import React from "react";
import { render, fireEvent } from "@testing-library/react";
import AdminAddGrants from "../components/AdminComponents/AdminAddGrants";

describe("AdminAddGrants Component", () => {
  it("renders correctly", () => {
    const { getByText, getByLabelText } = render(<AdminAddGrants />);

    expect(getByText("Grant Application")).toBeInTheDocument();
    expect(getByLabelText("Name:")).toBeInTheDocument();
    expect(getByLabelText("Grant Amount:")).toBeInTheDocument();
    expect(getByLabelText("Description:")).toBeInTheDocument();
    expect(getByLabelText("Grant Image:")).toBeInTheDocument();
    expect(getByText("Submit Application")).toBeInTheDocument();
  });

  it("submits the form correctly", () => {
    const { getByText, getByLabelText } = render(<AdminAddGrants />);
    const nameInput = getByLabelText("Name:");
    const grantAmountInput = getByLabelText("Grant Amount:");
    const descriptionInput = getByLabelText("Description:");
    const submitButton = getByText("Submit Application");

    fireEvent.change(nameInput, { target: { value: "Test Grant" } });
    fireEvent.change(grantAmountInput, { target: { value: "1000" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });

    fireEvent.click(submitButton);
  });
  
});
