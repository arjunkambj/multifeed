export interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface NavSectionConfig {
  id: string;
  label?: string;
  items: NavItemConfig[];
}

export interface NavModuleConfig {
  id: string;
  label: string;
  icon: string;
  defaultPath: string;
  sections: NavSectionConfig[];
}

export interface RailIconConfig {
  moduleId: string;
  label: string;
  icon: string;
  defaultPath: string;
}

export interface SidebarUserData {
  name: string;
  email: string;
  avatar: string;
}

export interface SidebarOrganizationData {
  name: string;
}

export interface SidebarData {
  user: SidebarUserData;
  organization: SidebarOrganizationData;
  railIcons: RailIconConfig[];
  bottomRailIcons: RailIconConfig[];
  modules: NavModuleConfig[];
  utilities: NavItemConfig[];
}
