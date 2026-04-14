export interface User {
  id: string;
  cc_user_id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  last_login_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
}

export interface Application {
  id: string;
  name: string;
  description?: string | null;
  app_type?: string | null;
  state?: string | null;
  instance?: {
    instance_type?: string | null;
    variant?: { name?: string | null; slug?: string | null } | null;
  } | null;
  zone?: string | null;
  last_deploy?: number | null;
}

export interface Addon {
  id: string;
  name: string;
  real_id?: string | null;
  region?: string | null;
  provider?: { id?: string | null; name?: string | null } | null;
  creation_date?: number | null;
}

export interface MetricSeries {
  name: string;
  data: [number, number][];
}

export interface MetricsResponse {
  panel: string;
  series: MetricSeries[];
}
