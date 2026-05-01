import { useState, type ReactNode } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarGroup,
  SidebarLink,
  SidebarSeparator,
  useSidebar,
  type NavItem,
} from "@/components/ui/sidebar";
import {
  IconAdjustments,
  IconAlertTriangle,
  IconBell,
  IconBuilding,
  IconChartBar,
  IconLayoutDashboard,
  IconLock,
  IconMessage,
  IconPalette,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import logoFull from "@/assets/blackBgBackground.png";
import logoMark from "@/assets/blackBgBackground2.png";
import { Link } from "react-router";

const iconClass = "h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200";

const items: NavItem[] = [
  {
    kind: "link",
    label: "Dashboard",
    href: "/",
    icon: <IconLayoutDashboard className={iconClass} />,
  },
  {
    kind: "link",
    label: "Tickets",
    href: "/tickets",
    icon: <IconChartBar className={iconClass} />,
  },
  {
    kind: "link",
    label: "Messages",
    href: "/messages",
    icon: <IconMessage className={iconClass} />,
  },
  {
    kind: "link",
    label: "Notifications",
    href: "/notifications",
    icon: <IconBell className={iconClass} />,
  },
  { kind: "separator" },
  {
    kind: "link",
    label: "Team",
    icon: <IconUsers className={iconClass} />,
    href: "/teams",
  },
  {
    kind: "group",
    group: {
      label: "Settings",
      icon: <IconAdjustments className={iconClass} />,
      links: [
        {
          label: "Profile",
          href: "/settings/profile",
          icon: <IconUser className={iconClass} />,
        },
        {
          label: "Security",
          href: "/settings/security",
          icon: <IconLock className={iconClass} />,
        },
        {
          label: "Notifications",
          href: "/settings/notifications",
          icon: <IconBell className={iconClass} />,
        },
        {
          label: "Appearance",
          href: "/settings/appearance",
          icon: <IconPalette className={iconClass} />,
        },
        {
          label: "Org Settings",
          href: "/settings/org",
          icon: <IconBuilding className={iconClass} />,
        },
        {
          label: "Danger Zone",
          href: "/settings/danger",
          icon: <IconAlertTriangle className={iconClass} />,
        },
      ],
    },
  },
];

export default function NavSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div
      className={cn(
        "flex w-full h-screen flex-col overflow-hidden bg-gray-100 md:flex-row dark:bg-neutral-800",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Logo />
            <div className="mt-8 flex flex-col gap-1">
              {items.map((item, idx) => {
                if (item.kind === "separator") {
                  return <SidebarSeparator key={`sep-${idx}`} />;
                }
                if (item.kind === "link") {
                  return (
                    <SidebarLink
                      key={item.label}
                      link={{
                        label: item.label,
                        href: item.href,
                        icon: item.icon,
                      }}
                    />
                  );
                }
                return (
                  <SidebarGroup
                    key={item.group.label}
                    group={item.group}
                    isExpanded={!!expanded[item.group.label]}
                    onToggle={() => toggleGroup(item.group.label)}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Harsh Sharma",
                href: "/settings",
                icon: (
                  <IconUser
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1">
          <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Logo = () => {
  const { open } = useSidebar();
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal text-black"
    >
      {open ? (
        <img src={logoFull} alt="filflo" className="h-7 w-auto" />
      ) : (
        <img
          src={logoMark}
          alt="filflo"
          className="h-8 w-8 shrink-0 object-contain"
        />
      )}
    </Link>
  );
};
