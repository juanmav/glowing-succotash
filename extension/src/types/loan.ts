export interface FormFillCommand {
  action: 'fill' | 'select' | 'click' | 'check';
  selector: string;
  value?: string;
}
