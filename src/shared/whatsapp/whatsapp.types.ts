export type WhatsappComponentType = 'BODY' | 'body';

export interface WhatsappComponentParameter {
  type: 'text';
  text: string;
}

export interface WhatsappComponent {
  type: WhatsappComponentType;
  parameters?: WhatsappComponentParameter[];
}

export interface WhatsappTemplatePayload {
  number: string;
  template: string;
  languageCode: string;
  components?: WhatsappComponent[];
}
