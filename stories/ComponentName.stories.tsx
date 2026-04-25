import type { Meta, StoryObj } from "@storybook/react";

const Placeholder = () => null;

const meta = {
  title: "Coverage/Placeholder",
  component: Placeholder,
} satisfies Meta<typeof Placeholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StateID: Story = {};
