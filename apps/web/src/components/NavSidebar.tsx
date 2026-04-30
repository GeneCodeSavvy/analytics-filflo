import { useState } from "react";
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
  IconBell,
  IconChartBar,
  IconLayoutDashboard,
  IconMail,
  IconMessage,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import logoFull from "@/assets/blackBgBackground.png";
import logoMark from "@/assets/blackBgBackground2.png";

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
    href: "/team",
  },
  {
    kind: "link",
    href: "#",
    label: "Settings",
    icon: <IconAdjustments className={iconClass} />,
  },
];

export default function NavSidebar() {
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
                label: "Manu Arora",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}

export const Logo = () => {
  const { open } = useSidebar();
  return (
    <a
      href="#"
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
    </a>
  );
};

const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex gap-2">
          {[...new Array(4)].map((_, idx) => (
            <div
              key={"first-array-demo-1" + idx}
              className="h-20 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
            ></div>
          ))}
        </div>
        <div className="flex flex-1 gap-2">
          {[...new Array(2)].map((_, idx) => (
            <div
              key={"second-array-demo-1" + idx}
              className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
