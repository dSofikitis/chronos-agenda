/** Mirrors services/api/src/main/java/.../EventDto.java + TaskDto.java. */

export interface EventResponse {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string | null;
  notes?: string | null;
}

export interface TaskResponse {
  id: string;
  title: string;
  dueBy?: string | null;
  priority: number;
  status: "open" | "done";
  notes?: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
}

export interface AssistantReply {
  backend: "anthropic" | "ollama";
  text: string;
}

export interface IcsUrl {
  url: string;
}
