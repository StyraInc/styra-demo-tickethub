compile:
	dotnet build

run: compile
	cd TicketHub && dotnet run Tickethub.dll --urls "http://0.0.0.0:4000" --logger "console;verbosity=detailed"

clean:
	dotnet clean
