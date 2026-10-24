import { TestBed } from "@angular/core/testing";

import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthenticatedSocketService } from "@fuzzy-waddle/platform-chat/client/data-access/authenticated-socket.service";
import { createAuthenticatedSocketServiceStub } from "@fuzzy-waddle/platform-chat/client/data-access/authenticated-socket.service.stub";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { Subscription } from "rxjs";

describe("SceneCommunicatorClientService", () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthenticatedSocketService, useValue: createAuthenticatedSocketServiceStub }]
    });
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("cannot finish an old awaited connection over a newer offline match", async () => {
    const socket = TestBed.inject(AuthenticatedSocketService), communicator = TestBed.inject(ProbableWaffleCommunicatorService);
    let release: (() => void) | undefined;
    jest.spyOn(socket, "getSocket").mockImplementation(() => new Promise((resolve) => { release = () => resolve(undefined); }));
    const start = jest.spyOn(communicator, "startCommunication");
    const old = service.createCommunicators("old", true).catch((error: unknown) => error);
    const current = await service.createCommunicators("new", false);
    if (!release) throw new Error("Old socket lookup did not start");
    release();
    expect(await old).toEqual(new Error("communicator_creation_superseded"));
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenLastCalledWith("new", undefined);
    expect(service.communicatorObservables).toEqual(current);
    await service.destroyCommunicators("new", [], false);
  });

  it("detaches old subscribers immediately and cannot finish delayed teardown over the next match", async () => {
    const socket = TestBed.inject(AuthenticatedSocketService), communicator = TestBed.inject(ProbableWaffleCommunicatorService);
    await service.createCommunicators("old", false);
    const stop = jest.spyOn(communicator, "stopCommunication"), subscription = new Subscription();
    let release: (() => void) | undefined;
    jest.spyOn(socket, "getSocket").mockImplementation(() => new Promise((resolve) => { release = () => resolve(undefined); }));
    const pending = service.destroyCommunicators("old", [subscription], true);
    expect(subscription.closed).toBe(true);
    const current = await service.createCommunicators("new", false);
    if (!release) throw new Error("Old socket lookup did not start");
    release();
    await pending;
    expect(stop).not.toHaveBeenCalled();
    expect(service.communicatorObservables).toEqual(current);
    await service.destroyCommunicators("new", [], false);
  });
});
