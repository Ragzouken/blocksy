import Panel from "./Panel";
import FlicksyEditor from "./FlicksyEditor";

export default class StagesPanel implements Panel
{
    public constructor(private readonly editor: FlicksyEditor)
    {
    }

    public show(): void
    {
        this.editor.setThree();

        this.refresh();
    }

    public hide(): void
    {
    }

    public refresh(): void
    {
    }
}
