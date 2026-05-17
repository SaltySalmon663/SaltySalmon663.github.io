import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Users, UserPlus, UserX, Star, DollarSign, Wrench, Fuel, Shield, Zap, CircleAlert as AlertCircle } from "lucide-react";

export type CrewRole = "engineer" | "conductor" | "fireman" | "brakeman";

export interface Worker {
  id: string;
  name: string;
  role: CrewRole;
  experience: number; // 1-100
  skill: number;      // 1-100
  reliability: number; // 1-100
  weeklyWage: number;
  assignedLocoId?: string;
  specialty?: string;
  hiredAt: number;
}

export interface CrewAssignment {
  locoId: string;
  engineer?: string;   // worker id
  conductor?: string;
  fireman?: string;
  brakeman?: string;
}

const FIRST_NAMES = [
  "Frank", "Walter", "Harold", "Chester", "Raymond", "Clifford", "Elmer",
  "Howard", "Clarence", "Eugene", "Bernard", "Arthur", "Leonard", "Herbert",
  "Milton", "Stanley", "Earl", "Lloyd", "Vernon", "Russel", "Alvin", "Ernest",
  "Harvey", "Glen", "Lester", "Morris", "Willard", "Ralph", "Maurice", "Elwood",
];

const LAST_NAMES = [
  "Sullivan", "Callahan", "Donnelly", "Murphy", "O'Brien", "Fitzgerald",
  "Henderson", "Kowalski", "Petrov", "Schmidt", "Hansen", "Lindqvist",
  "Yamamoto", "Nakamura", "Washington", "Jefferson", "Booker", "Turner",
  "Carver", "Owens", "Collins", "Barrett", "Gallagher", "Flanagan",
  "McAllister", "Whitfield", "Drummond", "Prater", "Holbrook", "Stanton",
];

const SPECIALTIES: Record<CrewRole, string[]> = {
  engineer: [
    "Steam Expert", "Diesel Specialist", "Night Runner", "Speed Merchant",
    "Fuel Saver", "Precision Driver", "Mountain Man", "Veteran Hand",
  ],
  conductor: [
    "Safety First", "Timekeeper", "Yard Master", "Freight Expert",
    "Passenger Pro", "Rule Book", "Quick Thinker", "Night Owl",
  ],
  fireman: [
    "Coal Master", "Fire Artist", "Efficiency King", "Fast Starter",
    "Steam Builder", "Cool Head", "Heavy Hauler", "Smooth Operator",
  ],
  brakeman: [
    "Iron Grip", "Precision Stopper", "Switch Expert", "Speed Demon",
    "Safety Net", "Cold Weather Pro", "Heavy Freight", "Quick Hands",
  ],
};

const ROLE_LABELS: Record<CrewRole, string> = {
  engineer: "Engineer",
  conductor: "Conductor",
  fireman: "Fireman",
  brakeman: "Brakeman",
};

const ROLE_DESCRIPTIONS: Record<CrewRole, string> = {
  engineer: "Controls the locomotive. High skill reduces fuel cost.",
  conductor: "Manages train operations. High reliability reduces breakdowns.",
  fireman: "Manages the boiler/engine. High skill boosts speed & efficiency.",
  brakeman: "Operates brakes and switches. High skill reduces session time.",
};

const BASE_WAGES: Record<CrewRole, number> = {
  engineer: 120,
  conductor: 95,
  fireman: 80,
  brakeman: 70,
};

const LOCO_NAMES: Record<string, string> = {
  "1": "NH 0703 DER-1",
  "2": "NH 370 & 371 A-B",
  "3": "NH 1404 & 1405 RS-11s",
  "4": "NH 503 RS-1",
  "5": "NH 0937 S-1",
  "6": "NH RDC BUDD",
};

function rollStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWorker(role: CrewRole): Omit<Worker, "id" | "hiredAt"> {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const specialtyList = SPECIALTIES[role];
  const specialty = specialtyList[Math.floor(Math.random() * specialtyList.length)];

  const experience = rollStat(10, 90);
  const skill = rollStat(20, 95);
  const reliability = rollStat(25, 98);

  // Wage scales with experience & skill
  const baseWage = BASE_WAGES[role];
  const experienceBonus = Math.floor(experience * 0.6);
  const skillBonus = Math.floor(skill * 0.4);
  const weeklyWage = baseWage + experienceBonus + skillBonus;

  return {
    name: `${firstName} ${lastName}`,
    role,
    experience,
    skill,
    reliability,
    weeklyWage,
    specialty,
  };
}

function getStatColor(value: number): string {
  if (value >= 80) return "text-green-600 dark:text-green-400";
  if (value >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getStatBg(value: number): string {
  if (value >= 80) return "[&>div]:bg-green-500";
  if (value >= 55) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

function getRoleBadgeColor(role: CrewRole): string {
  switch (role) {
    case "engineer": return "bg-blue-500 text-white";
    case "conductor": return "bg-green-600 text-white";
    case "fireman": return "bg-orange-500 text-white";
    case "brakeman": return "bg-slate-500 text-white";
  }
}

// Compute crew modifier effects for a loco
export function computeCrewEffects(
  workers: Worker[],
  assignment: CrewAssignment | undefined
): { fuelModifier: number; reliabilityModifier: number; crewCostModifier: number; speedModifier: number; label: string } {
  if (!assignment) {
    return { fuelModifier: 1, reliabilityModifier: 1, crewCostModifier: 1, speedModifier: 1, label: "No crew" };
  }

  const ids = [
    assignment.engineer,
    assignment.conductor,
    assignment.fireman,
    assignment.brakeman,
  ].filter(Boolean) as string[];

  if (ids.length === 0) {
    return { fuelModifier: 1, reliabilityModifier: 1, crewCostModifier: 1, speedModifier: 1, label: "No crew" };
  }

  const crew = ids.map((id) => workers.find((w) => w.id === id)).filter(Boolean) as Worker[];

  const engineer = crew.find((w) => w.role === "engineer");
  const conductor = crew.find((w) => w.role === "conductor");
  const fireman = crew.find((w) => w.role === "fireman");
  const brakeman = crew.find((w) => w.role === "brakeman");

  // Fuel: engineer skill reduces fuel cost (max -25%)
  const fuelModifier = engineer ? 1 - (engineer.skill / 100) * 0.25 : 1;

  // Reliability: conductor reliability reduces breakdown chance (expressed as modifier 0.7–1.0)
  const reliabilityModifier = conductor ? 1 - (conductor.reliability / 100) * 0.3 : 1;

  // Speed modifier from fireman (0.9–1.1 of normal session cost efficiency)
  const speedModifier = fireman ? 1 - (fireman.skill / 100) * 0.15 : 1;

  // Crew cost: brakeman efficiency bonus (-10% on crew operating costs if high skill)
  const crewCostModifier = brakeman ? 1 - (brakeman.skill / 100) * 0.1 : 1;

  const avgSkill = crew.reduce((s, w) => s + w.skill, 0) / crew.length;
  let label = "Inexperienced";
  if (avgSkill >= 80) label = "Veteran Crew";
  else if (avgSkill >= 65) label = "Seasoned Crew";
  else if (avgSkill >= 45) label = "Average Crew";

  return { fuelModifier, reliabilityModifier, crewCostModifier, speedModifier, label };
}

interface CrewManagerProps {
  workers: Worker[];
  assignments: CrewAssignment[];
  balance: number;
  onHireWorker: (worker: Worker) => void;
  onFireWorker: (workerId: string) => void;
  onAssignWorker: (locoId: string, role: CrewRole, workerId: string | undefined) => void;
}

export function CrewManager({
  workers,
  assignments,
  balance,
  onHireWorker,
  onFireWorker,
  onAssignWorker,
}: CrewManagerProps) {
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [fireDialogOpen, setFireDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CrewRole>("engineer");
  const [candidates, setCandidates] = useState<Omit<Worker, "id" | "hiredAt">[]>([]);
  const [workerToFire, setWorkerToFire] = useState<Worker | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ locoId: string; role: CrewRole } | null>(null);
  const [activeTab, setActiveTab] = useState<"roster" | "assignments">("roster");

  const weeklyPayroll = workers.reduce((s, w) => s + w.weeklyWage, 0);

  const openHireDialog = (role: CrewRole) => {
    setSelectedRole(role);
    // Generate 3 candidates
    const cands = Array.from({ length: 3 }, () => generateWorker(role));
    setCandidates(cands);
    setHireDialogOpen(true);
  };

  const hireCandidate = (candidate: Omit<Worker, "id" | "hiredAt">) => {
    const worker: Worker = {
      ...candidate,
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      hiredAt: Date.now(),
    };
    onHireWorker(worker);
    setHireDialogOpen(false);
  };

  const confirmFire = (worker: Worker) => {
    setWorkerToFire(worker);
    setFireDialogOpen(true);
  };

  const doFire = () => {
    if (workerToFire) {
      onFireWorker(workerToFire.id);
      setWorkerToFire(null);
      setFireDialogOpen(false);
    }
  };

  const openAssign = (locoId: string, role: CrewRole) => {
    setAssignTarget({ locoId, role });
    setAssignDialogOpen(true);
  };

  const getAssignment = (locoId: string) =>
    assignments.find((a) => a.locoId === locoId);

  const getWorkerById = (id?: string) =>
    id ? workers.find((w) => w.id === id) : undefined;

  const isWorkerAssigned = (workerId: string) =>
    assignments.some(
      (a) =>
        a.engineer === workerId ||
        a.conductor === workerId ||
        a.fireman === workerId ||
        a.brakeman === workerId
    );

  const availableForRole = (role: CrewRole) =>
    workers.filter((w) => w.role === role && !isWorkerAssigned(w.id));

  const locoIds = Object.keys(LOCO_NAMES);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crew Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xs text-muted-foreground mb-1">Total Workers</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{workers.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <div className="text-xs text-muted-foreground mb-1">Weekly Payroll</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">${weeklyPayroll}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-xs text-muted-foreground mb-1">Assigned</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {workers.filter((w) => isWorkerAssigned(w.id)).length}
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "roster"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-accent"
              }`}
              onClick={() => setActiveTab("roster")}
            >
              Roster ({workers.length})
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "assignments"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-accent"
              }`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </button>
          </div>

          {/* ROSTER TAB */}
          {activeTab === "roster" && (
            <div className="space-y-3">
              {/* Hire buttons */}
              <div className="grid grid-cols-2 gap-2">
                {(["engineer", "conductor", "fireman", "brakeman"] as CrewRole[]).map((role) => (
                  <Button
                    key={role}
                    variant="outline"
                    size="sm"
                    onClick={() => openHireDialog(role)}
                    className="text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Hire {ROLE_LABELS[role]}
                  </Button>
                ))}
              </div>

              {workers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No workers hired. Hire crew to operate your locomotives.
                </div>
              ) : (
                <ScrollArea className="h-[360px] pr-2">
                  <div className="space-y-3">
                    {workers.map((worker) => {
                      const assigned = isWorkerAssigned(worker.id);
                      return (
                        <div key={worker.id} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">{worker.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <Badge className={`text-xs ${getRoleBadgeColor(worker.role)}`}>
                                  {ROLE_LABELS[worker.role]}
                                </Badge>
                                {worker.specialty && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Star className="h-3 w-3" />
                                    {worker.specialty}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {assigned && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-400">
                                  On Duty
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmFire(worker)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Zap className="h-3 w-3" /> Skill
                              </div>
                              <Progress value={worker.skill} className={`h-1.5 ${getStatBg(worker.skill)}`} />
                              <div className={`text-xs font-medium mt-0.5 ${getStatColor(worker.skill)}`}>
                                {worker.skill}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Shield className="h-3 w-3" /> Reliability
                              </div>
                              <Progress value={worker.reliability} className={`h-1.5 ${getStatBg(worker.reliability)}`} />
                              <div className={`text-xs font-medium mt-0.5 ${getStatColor(worker.reliability)}`}>
                                {worker.reliability}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Wrench className="h-3 w-3" /> Experience
                              </div>
                              <Progress value={worker.experience} className={`h-1.5 ${getStatBg(worker.experience)}`} />
                              <div className={`text-xs font-medium mt-0.5 ${getStatColor(worker.experience)}`}>
                                {worker.experience}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${worker.weeklyWage}/week
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === "assignments" && (
            <ScrollArea className="h-[440px] pr-2">
              <div className="space-y-4">
                {locoIds.map((locoId) => {
                  const assignment = getAssignment(locoId);
                  const effects = computeCrewEffects(workers, assignment);
                  const roles: CrewRole[] = ["engineer", "conductor", "fireman", "brakeman"];

                  return (
                    <div key={locoId} className="p-3 rounded-lg border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{LOCO_NAMES[locoId]}</div>
                        <Badge
                          variant="outline"
                          className={
                            effects.label === "Veteran Crew"
                              ? "border-green-400 text-green-600"
                              : effects.label === "Seasoned Crew"
                              ? "border-amber-400 text-amber-600"
                              : effects.label === "No crew"
                              ? "border-red-400 text-red-600"
                              : "border-slate-400 text-slate-600"
                          }
                        >
                          {effects.label}
                        </Badge>
                      </div>

                      {/* Crew slot grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {roles.map((role) => {
                          const assignedId =
                            role === "engineer"
                              ? assignment?.engineer
                              : role === "conductor"
                              ? assignment?.conductor
                              : role === "fireman"
                              ? assignment?.fireman
                              : assignment?.brakeman;
                          const assignedWorker = getWorkerById(assignedId);

                          return (
                            <div
                              key={role}
                              className="p-2 rounded border bg-background space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  {ROLE_LABELS[role]}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1 text-xs"
                                    onClick={() => openAssign(locoId, role)}
                                  >
                                    {assignedWorker ? "Change" : "Assign"}
                                  </Button>
                                  {assignedWorker && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 px-1 text-xs text-destructive hover:text-destructive"
                                      onClick={() => onAssignWorker(locoId, role, undefined)}
                                    >
                                      X
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {assignedWorker ? (
                                <div>
                                  <div className="text-xs font-medium truncate">{assignedWorker.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Skill {assignedWorker.skill} · Rel {assignedWorker.reliability}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground italic">Unassigned</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Crew effect summary */}
                      {assignment && (assignment.engineer || assignment.conductor || assignment.fireman || assignment.brakeman) && (
                        <div className="grid grid-cols-2 gap-1 pt-1 border-t">
                          <div className="text-xs flex items-center gap-1">
                            <Fuel className="h-3 w-3 text-amber-500" />
                            <span className="text-muted-foreground">Fuel:</span>
                            <span className={effects.fuelModifier < 1 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                              {effects.fuelModifier < 1
                                ? `-${((1 - effects.fuelModifier) * 100).toFixed(0)}%`
                                : "Base"}
                            </span>
                          </div>
                          <div className="text-xs flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-blue-500" />
                            <span className="text-muted-foreground">Ops:</span>
                            <span className={effects.speedModifier < 1 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                              {effects.speedModifier < 1
                                ? `-${((1 - effects.speedModifier) * 100).toFixed(0)}%`
                                : "Base"}
                            </span>
                          </div>
                        </div>
                      )}

                      {!assignment?.engineer && (
                        <div className="flex items-center gap-2 p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          Engineer required to operate this locomotive
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* HIRE DIALOG */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hire a {ROLE_LABELS[selectedRole]}</DialogTitle>
            <DialogDescription>{ROLE_DESCRIPTIONS[selectedRole]}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {candidates.map((candidate, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3" />
                      {candidate.specialty}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-amber-600">${candidate.weeklyWage}/wk</div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground">Skill</div>
                    <div className={`font-bold ${getStatColor(candidate.skill)}`}>{candidate.skill}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Reliability</div>
                    <div className={`font-bold ${getStatColor(candidate.reliability)}`}>{candidate.reliability}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Experience</div>
                    <div className={`font-bold ${getStatColor(candidate.experience)}`}>{candidate.experience}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => hireCandidate(candidate)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Hire for ${candidate.weeklyWage}/week
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHireDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={() => setCandidates(Array.from({ length: 3 }, () => generateWorker(selectedRole)))}>
              Refresh Candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FIRE DIALOG */}
      <Dialog open={fireDialogOpen} onOpenChange={setFireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Employment</DialogTitle>
            <DialogDescription>
              {workerToFire && `Are you sure you want to let ${workerToFire.name} go? They will be removed from any assignments.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFireDialogOpen(false)}>
              Keep Them
            </Button>
            <Button variant="destructive" onClick={doFire}>
              <UserX className="h-4 w-4 mr-2" />
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN DIALOG */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Assign {assignTarget ? ROLE_LABELS[assignTarget.role] : ""}
            </DialogTitle>
            <DialogDescription>
              {assignTarget ? ROLE_DESCRIPTIONS[assignTarget.role] : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
            {assignTarget && availableForRole(assignTarget.role).length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No available {ROLE_LABELS[assignTarget.role].toLowerCase()}s. Hire one first.
              </div>
            )}
            {assignTarget &&
              availableForRole(assignTarget.role).map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    onAssignWorker(assignTarget.locoId, assignTarget.role, worker.id);
                    setAssignDialogOpen(false);
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">{worker.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Skill {worker.skill} · Rel {worker.reliability} · ${worker.weeklyWage}/wk
                    </div>
                    {worker.specialty && (
                      <div className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <Star className="h-3 w-3" />
                        {worker.specialty}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline">Select</Button>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
