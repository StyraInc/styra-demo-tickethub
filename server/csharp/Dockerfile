FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /TicketHub

# Copy everything
COPY . ./
# Restore as distinct layers
RUN dotnet build --verbosity=detailed
# Build and publish a release
RUN dotnet publish -c Release -o out

# Build runtime image
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /TicketHub
COPY --from=build-env /TicketHub/out .
ENTRYPOINT ["dotnet", "TicketHub.dll", "--urls", "http://0.0.0.0:4000", "--logger", "console;verbosity=detailed"]

